const jwt = require('jsonwebtoken')

/**
 * Express middleware that checks for a valid Bearer JWT
 * in the Authorization header. Attaches the decoded payload
 * to req.user when valid.
 *
 * Use this to protect any future API route:
 *   router.get('/api/protected', verifyToken, handler)
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const [scheme, token] = authHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Missing or invalid token' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token expired or invalid' })
  }
}

module.exports = verifyToken
