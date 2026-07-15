const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes  = require('./src/routes/auth')
const adminRoutes = require('./src/routes/admin')
const userRoutes  = require('./src/routes/user')
const fileRoutes  = require('./src/routes/files')
const verifyToken = require('./src/middleware/verifyToken')

const app = express()

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  : ['http://localhost:5173']

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) return cb(null, true)
    cb(null, false)
  },
  credentials: true,
}))
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
app.use('/api', verifyToken, userRoutes)
app.use('/api/projects', verifyToken, fileRoutes)

module.exports = app
