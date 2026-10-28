import { withApiHandler } from '../utils/handler'

export default withApiHandler(() => ({
  ok: true,
  service: 'nexura-app-server',
  timestamp: Date.now()
}))
