const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { db } = require('../firebase')

const router = express.Router()

/**
 * POST /api/login
 * Body: { email, password }
 * Looks the user up in Firestore, compares the bcrypt hash,
 * and returns a signed JWT on success.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' })
    }

    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get()

    if (snapshot.empty) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()

    const passwordMatches = await bcrypt.compare(password, userData.password)

    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: userDoc.id, email: userData.email, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    return res.json({
      success: true,
      token,
      user: {
        id: userDoc.id,
        email: userData.email,
        role: userData.role
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

module.exports = router
