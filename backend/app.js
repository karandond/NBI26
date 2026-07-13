const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./src/routes/auth')
const adminRoutes = require('./src/routes/admin')
const verifyToken = require('./src/middleware/verifyToken')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' })
})

app.use('/api', authRoutes)

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' })
  }
  next()
}

app.use('/api/admin', verifyToken, requireAdmin, adminRoutes)

module.exports = app
