const express = require('express')
const { db } = require('../firebase')

const router = express.Router()

// GET /api/me/projects — returns the logged-in user's customer and its projects
router.get('/me/projects', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get()
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    const customerId = userDoc.data().customerId
    if (!customerId) {
      return res.json({ success: true, customer: null, projects: [] })
    }
    const custDoc = await db.collection('customers').doc(customerId).get()
    if (!custDoc.exists) {
      return res.json({ success: true, customer: null, projects: [] })
    }
    const projSnap = await db.collection('projects').where('customerId', '==', customerId).get()
    const projects = projSnap.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      createdAt: doc.data().createdAt?.toDate?.() || null,
    }))
    return res.json({
      success: true,
      customer: { id: customerId, name: custDoc.data().name },
      projects,
    })
  } catch (err) {
    console.error('My projects error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

module.exports = router
