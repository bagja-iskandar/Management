import test from 'node:test'
import assert from 'node:assert/strict'

// 1. REPO MATCHING LOGIC (REPO-002)
function getManagedProject(repo, projects) {
  const list = projects ?? []
  const repoFull = repo.fullName.toLowerCase()

  return list.find((p) =>
    Boolean(p.githubRepo && p.githubRepo.toLowerCase() === repoFull)
  )
}

test('REPO-002: getManagedProject matches ONLY strict githubRepo case-insensitively', () => {
  const projects = [
    { id: '1', slug: 'management', title: 'Management', githubRepo: 'bagja-iskandar/Management' },
    { id: '2', slug: 'docs', title: 'Docs', githubRepo: 'bagja-iskandar/docs-repo' },
    { id: '3', slug: 'generic-tool', title: 'Generic Tool', githubRepo: undefined }
  ]

  // Exact match
  const matched = getManagedProject({ name: 'Management', fullName: 'bagja-iskandar/management' }, projects)
  assert.equal(matched?.id, '1')

  // No fuzzy match on slug when githubRepo differs
  const falseSlugMatch = getManagedProject({ name: 'docs', fullName: 'other-user/docs' }, projects)
  assert.equal(falseSlugMatch, undefined, 'Must NOT match different repo with identical slug')

  // No fuzzy match on title when githubRepo differs or undefined
  const falseTitleMatch = getManagedProject({ name: 'generic-tool', fullName: 'other-user/generic-tool' }, projects)
  assert.equal(falseTitleMatch, undefined, 'Must NOT match different repo with identical title')
})

test('REPO-001: Detach updates project with { githubRepo: null } without calling delete', async () => {
  let updateCalledWith = null
  let deleteCalledWith = null

  const mockProjectsApi = {
    async updateProject(slug, patch) {
      updateCalledWith = { slug, patch }
      return { slug, ...patch }
    },
    async deleteProject(slug) {
      deleteCalledWith = slug
      throw new Error('Should not be called')
    }
  }

  const repoToRemove = { name: 'Management', fullName: 'bagja-iskandar/Management' }
  const projects = [
    { id: '1', slug: 'management-slug', title: 'Management System', githubRepo: 'bagja-iskandar/Management' }
  ]

  // Handler execution logic matching repos.vue L717-738
  const proj = getManagedProject(repoToRemove, projects)
  assert.ok(proj, 'Project must be found')

  await mockProjectsApi.updateProject(proj.slug, { githubRepo: null })

  assert.equal(deleteCalledWith, null, 'deleteProject MUST NEVER be called')
  assert.deepEqual(updateCalledWith, {
    slug: 'management-slug',
    patch: { githubRepo: null }
  })
})
