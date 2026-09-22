export interface GitHubRepoSummary {
  id: number
  name: string
  fullName: string              // e.g. 'bagja-iskandar/Management'
  private: boolean
  htmlUrl: string
  description?: string
  language?: string             // Primary language
  defaultBranch: string
  pushedAt: string
  stargazersCount: number
}

export interface GitHubCommitItem {
  sha: string
  shortSha: string              // First 7 chars
  message: string
  authorName: string
  date: string
  htmlUrl: string
  repoName: string
}

export interface GitHubBranch {
  name: string
  commitSha: string
  protected: boolean
}

export interface GitHubCommitFile {
  filename: string
  status: string
  additions: number
  deletions: number
  changes: number
  patch?: string
}

export interface GitHubCommitDetail {
  sha: string
  shortSha: string
  message: string
  authorName: string
  date: string
  htmlUrl: string
  stats?: {
    total: number
    additions: number
    deletions: number
  }
  files: GitHubCommitFile[]
}

export interface GitHubWorkflowRun {
  id: number
  name: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'cancelled' | 'timed_out' | 'action_required' | null
  runNumber: number
  htmlUrl: string
  branch: string
  commitSha: string
  commitMessage: string
  event: string
  createdAt: string
  updatedAt: string
  durationSeconds: number
}

export interface GitHubWorkflowJob {
  id: number
  name: string
  status: string
  conclusion: string | null
  startedAt: string
  completedAt: string | null
  steps: Array<{
    name: string
    status: string
    conclusion: string | null
    number: number
  }>
}

export type GitHubSecuritySeverity = 'low' | 'medium' | 'high' | 'critical'

export interface GitHubSecurityAlert {
  id: number | string
  type: 'dependabot' | 'secret_scanning' | 'code_scanning'
  number: number
  state: 'open' | 'fixed' | 'dismissed' | 'resolved'
  severity: GitHubSecuritySeverity
  title: string
  description?: string
  packageName?: string
  vulnerableVersion?: string
  patchedVersion?: string
  secretType?: string
  cveId?: string
  ghsaId?: string
  htmlUrl: string
  createdAt: string
}

export interface GitHubSecuritySummary {
  enabled: {
    dependabot: boolean
    secretScanning: boolean
    codeScanning: boolean
  }
  totalAlerts: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  alerts: GitHubSecurityAlert[]
}

export type GitHubDeploymentState =
  | 'success'
  | 'failure'
  | 'in_progress'
  | 'queued'
  | 'pending'
  | 'error'
  | 'inactive'

export interface GitHubDeploymentItem {
  id: number
  environment: string
  state: GitHubDeploymentState
  commitSha: string
  shortSha: string
  ref: string
  description?: string
  environmentUrl?: string
  logUrl?: string
  createdAt: string
  updatedAt: string
}

export interface GitHubCommitCheck {
  id: number
  context: string
  state: 'success' | 'failure' | 'pending' | 'error'
  description?: string
  targetUrl?: string
  createdAt: string
}

export interface GitHubDeploymentSummary {
  latestDeployment: GitHubDeploymentItem | null
  commitStatus: {
    state: 'success' | 'failure' | 'pending' | 'neutral'
    totalCount: number
    checks: GitHubCommitCheck[]
  }
  deployments: GitHubDeploymentItem[]
}

export interface GitHubPullRequest {
  id: number
  number: number
  title: string
  state: 'open' | 'closed' | 'merged'
  draft: boolean
  htmlUrl: string
  authorName: string
  authorAvatar?: string
  headBranch: string
  baseBranch: string
  headSha: string
  createdAt: string
  updatedAt: string
  mergedAt?: string
  closedAt?: string
  commentsCount: number
}

export interface GitHubIssueItem {
  id: number
  number: number
  title: string
  state: 'open' | 'closed'
  htmlUrl: string
  authorName: string
  authorAvatar?: string
  labels: Array<{ name: string; color: string }>
  createdAt: string
  updatedAt: string
  closedAt?: string
  commentsCount: number
}

export interface GitHubRepoActivitySummary {
  openPrCount: number
  closedPrCount: number
  openIssueCount: number
  closedIssueCount: number
  pullRequests: GitHubPullRequest[]
  issues: GitHubIssueItem[]
}

export type GitHubPackageType = 'container' | 'npm' | 'docker' | 'maven' | 'rubygems' | 'nuget'

export interface GitHubPackageItem {
  id: number
  name: string
  packageType: GitHubPackageType
  owner: string
  versionCount: number
  visibility: 'public' | 'private'
  htmlUrl: string
  createdAt: string
  updatedAt: string
  repositoryName?: string
}

export interface GitHubPackageSummary {
  hasScope: boolean
  totalPackages: number
  packages: GitHubPackageItem[]
  message?: string
}
