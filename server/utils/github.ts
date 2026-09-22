import { throwApiError } from './errors'

export interface GitHubFetchOptions {
  headers?: Record<string, string>
  params?: Record<string, any>
  query?: Record<string, any>
  method?: string
  body?: any
  [key: string]: any
}

export async function githubFetch<T>(
  path: string,
  options: GitHubFetchOptions = {}
): Promise<T> {
  const { headers = {}, ...rest } = options

  try {
    return await $fetch<T>(path, {
      baseURL: 'https://api.github.com',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Nexura',
        ...headers
      },
      ...rest
    })
  } catch (error: any) {
    const status = error?.status || error?.statusCode || error?.response?.status
    if (status === 401) {
      throwApiError(401, 'GITHUB_AUTH_FAILED', 'Invalid GitHub token')
    }
    if (status === 403) {
      throwApiError(403, 'GITHUB_RATE_LIMITED', 'GitHub API rate limit exceeded')
    }
    throw error
  }
}

export function createGitHubClient(token: string) {
  const defaultHeaders: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Nexura'
  }

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`
  }

  return {
    fetch: <T>(path: string, options: GitHubFetchOptions = {}) => {
      return githubFetch<T>(path, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...(options.headers || {})
        }
      })
    }
  }
}
