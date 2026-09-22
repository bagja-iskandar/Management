import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { throwApiError } from '../../utils/errors'
import type { GitHubSecurityAlert, GitHubSecuritySeverity, GitHubSecuritySummary } from '~/types'

function normalizeSeverity(severity?: string): GitHubSecuritySeverity {
  const s = String(severity || '').toLowerCase()
  if (s === 'critical') return 'critical'
  if (s === 'high' || s === 'error') return 'high'
  if (s === 'moderate' || s === 'medium' || s === 'warning') return 'medium'
  return 'low'
}

function normalizeState(state?: string): 'open' | 'fixed' | 'dismissed' | 'resolved' {
  const s = String(state || '').toLowerCase()
  if (s === 'fixed') return 'fixed'
  if (s === 'dismissed' || s === 'auto_dismissed') return 'dismissed'
  if (s === 'resolved' || s === 'closed') return 'resolved'
  return 'open'
}

const severityOrder: Record<GitHubSecuritySeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
}

const fetchCachedSecurity = defineCachedFunction(
  async (token: string, repo: string): Promise<GitHubSecuritySummary> => {
    if (!token) {
      return {
        enabled: {
          dependabot: false,
          secretScanning: false,
          codeScanning: false
        },
        totalAlerts: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        alerts: []
      }
    }

    const client = createGitHubClient(token)
    const enabled = {
      dependabot: false,
      secretScanning: false,
      codeScanning: false
    }
    const alerts: GitHubSecurityAlert[] = []

    await Promise.all([
      // a. Secret Scanning: /repos/${fullRepo}/secret-scanning/alerts?per_page=10
      (async () => {
        try {
          const raw = await client.fetch<any[]>(`/repos/${repo}/secret-scanning/alerts?per_page=10`)
          if (Array.isArray(raw)) {
            enabled.secretScanning = true
            for (const item of raw) {
              alerts.push({
                id: item.number ?? item.id,
                type: 'secret_scanning',
                number: item.number ?? 0,
                state: normalizeState(item.state),
                severity: 'critical',
                title: item.secret_type_display_name || item.secret_type || 'Secret Leak',
                description: item.resolution_comment || undefined,
                secretType: item.secret_type_display_name || item.secret_type,
                htmlUrl: item.html_url || '',
                createdAt: item.created_at || ''
              })
            }
          } else {
            enabled.secretScanning = false
          }
        } catch {
          enabled.secretScanning = false
        }
      })(),

      // b. Dependabot: /repos/${fullRepo}/dependabot/alerts?state=open&per_page=10
      (async () => {
        try {
          const raw = await client.fetch<any[]>(`/repos/${repo}/dependabot/alerts?state=open&per_page=10`)
          if (Array.isArray(raw)) {
            enabled.dependabot = true
            for (const item of raw) {
              alerts.push({
                id: item.number ?? item.id,
                type: 'dependabot',
                number: item.number ?? 0,
                state: normalizeState(item.state),
                severity: normalizeSeverity(item.security_advisory?.severity || 'medium'),
                title: item.security_advisory?.summary || item.dependency?.package?.name || 'Vulnerable Package',
                description: item.security_advisory?.description || undefined,
                packageName: item.dependency?.package?.name,
                vulnerableVersion: item.security_vulnerability?.vulnerable_version_range,
                patchedVersion: item.security_vulnerability?.first_patched_version?.identifier,
                cveId: item.security_advisory?.cve_id,
                ghsaId: item.security_advisory?.ghsa_id,
                htmlUrl: item.html_url || '',
                createdAt: item.created_at || ''
              })
            }
          } else {
            enabled.dependabot = false
          }
        } catch {
          enabled.dependabot = false
        }
      })(),

      // c. Code Scanning: /repos/${fullRepo}/code-scanning/alerts?state=open&per_page=10
      (async () => {
        try {
          const raw = await client.fetch<any[]>(`/repos/${repo}/code-scanning/alerts?state=open&per_page=10`)
          if (Array.isArray(raw)) {
            enabled.codeScanning = true
            for (const item of raw) {
              alerts.push({
                id: item.number ?? item.id,
                type: 'code_scanning',
                number: item.number ?? 0,
                state: normalizeState(item.state),
                severity: normalizeSeverity(item.rule?.security_severity_level || item.rule?.severity || 'medium'),
                title: item.rule?.description || item.rule?.id || 'Code Scanning Alert',
                description: item.most_recent_instance?.message?.text || item.rule?.description || undefined,
                htmlUrl: item.html_url || '',
                createdAt: item.created_at || ''
              })
            }
          } else {
            enabled.codeScanning = false
          }
        } catch {
          enabled.codeScanning = false
        }
      })()
    ])

    alerts.sort((a, b) => {
      const diff = severityOrder[a.severity] - severityOrder[b.severity]
      if (diff !== 0) return diff
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })

    let criticalCount = 0
    let highCount = 0
    let mediumCount = 0
    let lowCount = 0

    for (const alert of alerts) {
      if (alert.severity === 'critical') criticalCount++
      else if (alert.severity === 'high') highCount++
      else if (alert.severity === 'medium') mediumCount++
      else if (alert.severity === 'low') lowCount++
    }

    return {
      enabled,
      totalAlerts: alerts.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      alerts
    }
  },
  {
    maxAge: 60,
    name: 'github-security',
    getKey: (token: string, repo: string) => `${token ? 'auth' : 'anon'}:${repo}`
  }
)

export default withApiHandler(async (event): Promise<GitHubSecuritySummary> => {
  const query = getQuery(event)
  const repoParam = typeof query.repo === 'string' ? query.repo.trim() : ''

  if (!repoParam) {
    throwApiError(400, 'INVALID_REPO', 'Query parameter "repo" is required (format: owner/repo)')
  }

  const config = useRuntimeConfig(event)
  const token = (config.githubToken || '').trim()

  if (!token) {
    return {
      enabled: {
        dependabot: false,
        secretScanning: false,
        codeScanning: false
      },
      totalAlerts: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      alerts: []
    }
  }

  let fullRepo = repoParam
  if (!fullRepo.includes('/')) {
    const defaultOwner = config.githubUsername || 'bagja-iskandar'
    fullRepo = `${defaultOwner}/${fullRepo}`
  }

  return await fetchCachedSecurity(token, fullRepo)
})
