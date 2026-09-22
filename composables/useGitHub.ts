import { computed, toValue, type Ref } from 'vue'
import type {
  GitHubRepoSummary,
  GitHubCommitItem,
  GitHubBranch,
  GitHubCommitDetail,
  GitHubWorkflowRun,
  GitHubWorkflowJob,
  GitHubSecuritySummary,
  GitHubDeploymentSummary,
  GitHubRepoActivitySummary,
  GitHubPackageSummary
} from '~/types'


export function useGitHubRepos() {
  const { data: repos, error, pending, refresh } = useLazyAsyncData<GitHubRepoSummary[]>(
    'github-repos',
    () => $fetch<GitHubRepoSummary[]>('/api/github/repos')
  )

  return { repos, error, pending, refresh }
}

export function useGitHubCommits(repo: string | Ref<string>, limit?: number) {
  const repoValue = computed(() => (typeof repo === 'string' ? repo : toValue(repo)))

  const { data: commits, error, pending, refresh } = useLazyAsyncData<GitHubCommitItem[]>(
    () => `github-commits-${repoValue.value}`,
    () => {
      const r = repoValue.value
      if (!r) return Promise.resolve([])
      return $fetch<GitHubCommitItem[]>('/api/github/commits', {
        params: { repo: r, limit }
      })
    },
    {
      watch: [repoValue]
    }
  )

  return { commits, error, pending, refresh }
}

export function useGitHubBranches(repo: string | Ref<string>) {
  const repoValue = computed(() => (typeof repo === 'string' ? repo : toValue(repo)))

  const { data: branches, error, pending, refresh } = useLazyAsyncData<GitHubBranch[]>(
    () => `github-branches-${repoValue.value}`,
    () => {
      const r = repoValue.value
      if (!r) return Promise.resolve([])
      return $fetch<GitHubBranch[]>('/api/github/branches', {
        params: { repo: r }
      })
    },
    {
      watch: [repoValue]
    }
  )

  return { branches, error, pending, refresh }
}

export function useGitHubWorkflows(repo: string | Ref<string>, limit?: number) {
  const repoValue = computed(() => (typeof repo === 'string' ? repo : toValue(repo)))

  const { data: workflows, error, pending, refresh } = useLazyAsyncData<GitHubWorkflowRun[]>(
    () => `github-workflows-${repoValue.value}`,
    () => {
      const r = repoValue.value
      if (!r) return Promise.resolve([])
      return $fetch<GitHubWorkflowRun[]>('/api/github/workflows', {
        params: { repo: r, limit }
      })
    },
    {
      watch: [repoValue]
    }
  )

  return { workflows, error, pending, refresh }
}

export function rerunWorkflow(repo: string, runId: number) {
  return $fetch<{ ok: boolean; message: string }>('/api/github/workflow-rerun', {
    method: 'POST',
    body: { repo, runId }
  })
}

export function fetchWorkflowJobs(repo: string, runId: number) {
  return $fetch<GitHubWorkflowJob[]>('/api/github/workflow-jobs', {
    params: { repo, runId }
  })
}

export function useGitHubSecurity(repo: string | Ref<string>) {
  const repoValue = computed(() => (typeof repo === 'string' ? repo : toValue(repo)))

  const { data: security, error, pending, refresh } = useLazyAsyncData<GitHubSecuritySummary>(
    () => `github-security-${repoValue.value}`,
    () => {
      const r = repoValue.value
      if (!r) {
        return Promise.resolve({
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
        })
      }
      return $fetch<GitHubSecuritySummary>('/api/github/security', {
        params: { repo: r }
      })
    },
    {
      watch: [repoValue]
    }
  )

  return { security, data: security, error, pending, refresh }
}

export function fetchSecurity(repo: string) {
  return $fetch<GitHubSecuritySummary>('/api/github/security', {
    params: { repo }
  })
}

export function useGitHubDeployments(repo: string | Ref<string>, limit?: number) {
  const repoValue = computed(() => (typeof repo === 'string' ? repo : toValue(repo)))

  const { data: deployments, error, pending, refresh } = useLazyAsyncData<GitHubDeploymentSummary>(
    () => `github-deployments-${repoValue.value}`,
    () => {
      const r = repoValue.value
      if (!r) {
        return Promise.resolve({
          latestDeployment: null,
          commitStatus: {
            state: 'neutral',
            totalCount: 0,
            checks: []
          },
          deployments: []
        })
      }
      return $fetch<GitHubDeploymentSummary>('/api/github/deployments', {
        params: { repo: r, limit }
      })
    },
    {
      watch: [repoValue]
    }
  )

  return { deployments, data: deployments, error, pending, refresh }
}

export function fetchDeployments(repo: string, limit?: number) {
  return $fetch<GitHubDeploymentSummary>('/api/github/deployments', {
    params: { repo, limit }
  })
}

export function useGitHubPullsAndIssues(repo: string | Ref<string>, limit?: number) {
  const repoValue = computed(() => (typeof repo === 'string' ? repo : toValue(repo)))

  const { data: activity, error, pending, refresh } = useLazyAsyncData<GitHubRepoActivitySummary>(
    () => `github-pulls-issues-${repoValue.value}`,
    () => {
      const r = repoValue.value
      if (!r) {
        return Promise.resolve({
          openPrCount: 0,
          closedPrCount: 0,
          openIssueCount: 0,
          closedIssueCount: 0,
          pullRequests: [],
          issues: []
        })
      }
      return $fetch<GitHubRepoActivitySummary>('/api/github/pulls-issues', {
        params: { repo: r, limit }
      })
    },
    {
      watch: [repoValue]
    }
  )

  return { activity, data: activity, pullsAndIssues: activity, error, pending, refresh }
}

export function fetchPullsAndIssues(repo: string, limit?: number) {
  return $fetch<GitHubRepoActivitySummary>('/api/github/pulls-issues', {
    params: { repo, limit }
  })
}

export function createGitHubIssue(payload: {
  repo: string
  taskId?: string
  title: string
  body?: string
  labels?: string[]
}) {
  return $fetch<{
    ok: boolean
    issue: {
      number: number
      title: string
      htmlUrl: string
    }
  }>('/api/github/create-issue', {
    method: 'POST',
    body: payload
  })
}

export function useGitHubPackages(repo?: string | Ref<string>) {
  const repoValue = computed(() => {
    if (!repo) return ''
    return typeof repo === 'string' ? repo : toValue(repo)
  })

  const { data: packages, error, pending, refresh } = useLazyAsyncData<GitHubPackageSummary>(
    () => `github-packages-${repoValue?.value || 'user'}`,
    () => {
      const r = repoValue?.value
      return $fetch<GitHubPackageSummary>('/api/github/packages', {
        params: r ? { repo: r } : undefined
      })
    },
    {
      watch: [repoValue]
    }
  )

  return { packages, data: packages, error, pending, refresh }
}

export function fetchPackages(repo?: string) {
  return $fetch<GitHubPackageSummary>('/api/github/packages', {
    params: repo ? { repo } : undefined
  })
}

export function useGitHubGlobalCommits(limit?: number) {
  const { data: commits, error, pending, refresh } = useLazyAsyncData<GitHubCommitItem[]>(
    () => `github-global-commits-${limit || 25}`,
    () => $fetch<GitHubCommitItem[]>('/api/github/global-commits', {
      params: { limit: limit || 25 }
    })
  )
  return { commits, data: commits, error, pending, refresh }
}

export function fetchGlobalCommits(limit?: number, repo?: string) {
  return $fetch<GitHubCommitItem[]>('/api/github/global-commits', {
    params: { limit: limit || 25, ...(repo ? { repo } : {}) }
  })
}

export function useGitHub() {
  return {
    useGitHubRepos,
    useGitHubCommits,
    useGitHubBranches,
    useGitHubWorkflows,
    useGitHubSecurity,
    useGitHubDeployments,
    useGitHubPullsAndIssues,
    useGitHubPackages,
    useGitHubGlobalCommits,
    fetchRepos: () => $fetch<GitHubRepoSummary[]>('/api/github/repos'),
    fetchCommits: (repo: string, limit?: number) =>
      $fetch<GitHubCommitItem[]>('/api/github/commits', { params: { repo, limit } }),
    fetchGlobalCommits: (limit?: number, repo?: string) =>
      $fetch<GitHubCommitItem[]>('/api/github/global-commits', {
        params: { limit: limit || 25, ...(repo ? { repo } : {}) }
      }),
    fetchBranches: (repo: string) =>
      $fetch<GitHubBranch[]>('/api/github/branches', { params: { repo } }),
    fetchCommitDetail: (repo: string, sha: string) =>
      $fetch<GitHubCommitDetail | null>('/api/github/commit-detail', { params: { repo, sha } }),
    fetchWorkflows: (repo: string, limit?: number) =>
      $fetch<GitHubWorkflowRun[]>('/api/github/workflows', { params: { repo, limit } }),
    fetchWorkflowJobs,
    fetchSecurity,
    fetchDeployments,
    fetchPullsAndIssues,
    fetchPackages,
    rerunWorkflow,
    createGitHubIssue
  }
}



