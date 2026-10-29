import { getCookie, getHeader, setHeader } from 'h3'
import { withApiHandler } from '../../utils/handler'
import { throwApiError } from '../../utils/errors'
import { resolveSecurityKeys, verifySessionToken, verifyAccessKey } from '../../utils/auth'
import { projectRepository, taskRepository, sprintRepository, noteRepository } from '../../repositories'

export default withApiHandler(async (event) => {
  // 1. Explicit server-side authentication guard
  const { allKeys } = resolveSecurityKeys()

  if (allKeys.length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throwApiError(500, 'SERVER_SECURITY_UNCONFIGURED', 'Server security configuration missing.')
    }
    if (process.env.NEXURA_DEV_AUTH_BYPASS !== 'true') {
      throwApiError(401, 'UNAUTHORIZED', 'Authentication required: Dev bypass disabled and no keys configured.')
    }
  } else {
    const authHeader = getHeader(event, 'authorization') || ''
    const bearerToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : ''
    const cookieToken = (getCookie(event, 'nexura_session') || '').trim()

    let isAuthorized = false

    if (bearerToken) {
      if (bearerToken.startsWith('v1.')) {
        const res = verifySessionToken(bearerToken, allKeys)
        if (res.valid) isAuthorized = true
      } else if (verifyAccessKey(bearerToken, allKeys)) {
        isAuthorized = true
      }
    }

    if (!isAuthorized && cookieToken) {
      const res = verifySessionToken(cookieToken, allKeys)
      if (res.valid) isAuthorized = true
    }

    if (!isAuthorized) {
      throwApiError(401, 'UNAUTHORIZED', 'Authentication required to export workspace data.')
    }
  }

  // 2. Extract workspace entities (Fail-Fast Policy)
  try {
    const [projects, tasks, sprints, notes] = await Promise.all([
      projectRepository.findAll(),
      taskRepository.findAll(),
      sprintRepository.findAll(),
      noteRepository.findAll()
    ])

    const exportedAt = new Date().toISOString()
    const filename = `nexura-backup-${exportedAt.slice(0, 10)}.json`

    setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
    setHeader(event, 'Content-Type', 'application/json')

    return {
      version: '1.0',
      exportedAt,
      environment: process.env.NODE_ENV || 'development',
      counts: {
        projects: projects.length,
        tasks: tasks.length,
        sprints: sprints.length,
        notes: notes.length,
        totalRecords: projects.length + tasks.length + sprints.length + notes.length
      },
      data: {
        projects,
        tasks,
        sprints,
        notes
      }
    }
  } catch (err: any) {
    throwApiError(500, 'BACKUP_READ_FAILED', `Failed to read workspace repositories: ${err.message || 'Unknown error'}`)
  }
})
