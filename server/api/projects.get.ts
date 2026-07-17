import { getArray } from '../utils/store'
import { withApiHandler } from '../utils/handler'
import type { Project } from '~/types'

export default withApiHandler(async () => {
  const projects = await getArray<Project>('projects')
  return projects
})
