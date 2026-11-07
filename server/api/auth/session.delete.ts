import { deleteCookie } from 'h3'
import { withApiHandler } from '../../utils/handler'

export default withApiHandler(async (event) => {
  deleteCookie(event, 'nexura_session', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })

  return {
    success: true,
    message: 'Session cleared successfully'
  }
})
