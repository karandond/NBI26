const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { db, admin } = require('../firebase')

const router = express.Router()

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

    // Admins bypass status checks; regular users must be approved
    if (userData.role !== 'admin') {
      if (userData.status === 'pending') {
        return res.status(403).json({ success: false, message: 'Your account is pending admin approval.' })
      }
      if (userData.status === 'rejected') {
        return res.status(403).json({ success: false, message: 'Your account has been rejected. Contact the administrator.' })
      }
    }

    const token = jwt.sign(
      { id: userDoc.id, email: userData.email, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    return res.json({
      success: true,
      token,
      user: { id: userDoc.id, email: userData.email, role: userData.role }
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
    }

    const existing = await db.collection('users').where('email', '==', email).limit(1).get()
    if (!existing.empty) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await db.collection('users').add({
      email,
      password: hashedPassword,
      role: 'user',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    return res.status(201).json({
      success: true,
      message: 'Account created. Please wait for admin approval before logging in.'
    })
  } catch (err) {
    console.error('Signup error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

module.exports = router
