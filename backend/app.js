const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./src/routes/auth')

const app = express()

app.use(cors())
app.use(express.json())

// Health check — useful for confirming the deployment is alive
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' })
})

app.use('/api', authRoutes)

// Add future protected routes here, e.g.:
// const verifyToken = require('./src/middleware/verifyToken')
// app.use('/api/users', verifyToken, require('./src/routes/users'))

module.exports = app
