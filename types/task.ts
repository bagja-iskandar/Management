export interface Task {
  id: string
  name: string
  status: 'todo' | 'proses' | 'selesai'
  date: string
  createdAt?: string
  updatedAt?: string
}
