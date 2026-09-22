import { NitroTaskRepository } from './nitro/nitro-task.repository'
import { NitroProjectRepository } from './nitro/nitro-project.repository'
import { NitroSprintRepository } from './nitro/nitro-sprint.repository'
import type { ITaskRepository } from './contracts/task.repository'
import type { IProjectRepository } from './contracts/project.repository'
import type { ISprintRepository } from './contracts/sprint.repository'

export * from './contracts'

// Singleton repository instances
export const taskRepository: ITaskRepository = new NitroTaskRepository()
export const projectRepository: IProjectRepository = new NitroProjectRepository()
export const sprintRepository: ISprintRepository = new NitroSprintRepository()
