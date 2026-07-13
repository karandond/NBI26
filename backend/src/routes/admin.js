const express = require('express')
const { db } = require('../firebase')

const router = express.Router()

// GET /api/admin/users — list all non-admin users
router.get('/users', async (req, res) => {
  try {
    const snapshot = await db.collection('users').where('role', '!=', 'admin').get()

    const users = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        email: doc.data().email,
        role: doc.data().role,
        status: doc.data().status || 'pending',
        createdAt: doc.data().createdAt?.toDate?.() || null
      }))
      .sort((a, b) => {
        // pending first, then by createdAt descending
        if (a.status === 'pending' && b.status !== 'pending') return -1
        if (a.status !== 'pending' && b.status === 'pending') return 1
        return (b.createdAt || 0) - (a.createdAt || 0)
      })

    return res.json({ success: true, users })
  } catch (err) {
    console.error('Admin users error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

// PATCH /api/admin/users/:id/status — approve or reject a user
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be "approved" or "rejected"' })
    }

    const userRef = db.collection('users').doc(id)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (userDoc.data().role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot modify admin accounts' })
    }

    await userRef.update({ status })

    return res.json({ success: true, message: `User ${status} successfully` })
  } catch (err) {
    console.error('Status update error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

module.exports = router
