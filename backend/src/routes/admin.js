const express = require('express')
const { FieldValue } = require('firebase-admin/firestore')
const { db } = require('../firebase')

const router = express.Router()

// ── Users ─────────────────────────────────────────────────────────────

router.get('/users', async (req, res) => {
  try {
    const snapshot = await db.collection('users').where('role', '!=', 'admin').get()
    const users = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        email: doc.data().email,
        role: doc.data().role,
        status: doc.data().status || 'pending',
        customerId: doc.data().customerId || null,
        createdAt: doc.data().createdAt?.toDate?.() || null,
      }))
      .sort((a, b) => {
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

router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be "approved" or "rejected"' })
    }
    const userRef = db.collection('users').doc(id)
    const userDoc = await userRef.get()
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found' })
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

router.patch('/users/:id/customer', async (req, res) => {
  try {
    const { id } = req.params
    const { customerId } = req.body
    const userRef = db.collection('users').doc(id)
    const userDoc = await userRef.get()
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found' })
    if (userDoc.data().role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot modify admin accounts' })
    }
    await userRef.update({ customerId: customerId || null })
    return res.json({ success: true })
  } catch (err) {
    console.error('Assign customer error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

// ── Customers ─────────────────────────────────────────────────────────

router.get('/customers', async (req, res) => {
  try {
    const snap = await db.collection('customers').get()
    const customers = []
    for (const doc of snap.docs) {
      const projSnap = await db.collection('projects').where('customerId', '==', doc.id).get()
      customers.push({
        id: doc.id,
        name: doc.data().name,
        createdAt: doc.data().createdAt?.toDate?.() || null,
        projects: projSnap.docs.map((p) => ({
          id: p.id,
          name: p.data().name,
          createdAt: p.data().createdAt?.toDate?.() || null,
        })),
      })
    }
    customers.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    return res.json({ success: true, customers })
  } catch (err) {
    console.error('Get customers error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

router.post('/customers', async (req, res) => {
  try {
    const { name } = req.body
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' })
    }
    const existing = await db.collection('customers').where('name', '==', name.trim()).get()
    if (!existing.empty) {
      return res.status(400).json({ success: false, message: 'A customer with this name already exists' })
    }
    const ref = await db.collection('customers').add({
      name: name.trim(),
      createdAt: FieldValue.serverTimestamp(),
    })
    return res.json({ success: true, id: ref.id, name: name.trim() })
  } catch (err) {
    console.error('Create customer error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

router.delete('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params
    const custDoc = await db.collection('customers').doc(id).get()
    if (!custDoc.exists) return res.status(404).json({ success: false, message: 'Customer not found' })
    const projSnap = await db.collection('projects').where('customerId', '==', id).get()
    const batch = db.batch()
    projSnap.docs.forEach((doc) => batch.delete(doc.ref))
    batch.delete(db.collection('customers').doc(id))
    await batch.commit()
    return res.json({ success: true })
  } catch (err) {
    console.error('Delete customer error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

// ── Projects ──────────────────────────────────────────────────────────

router.post('/customers/:id/projects', async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Project name is required' })
    }
    const custDoc = await db.collection('customers').doc(id).get()
    if (!custDoc.exists) return res.status(404).json({ success: false, message: 'Customer not found' })
    const existing = await db.collection('projects')
      .where('customerId', '==', id)
      .where('name', '==', name.trim())
      .get()
    if (!existing.empty) {
      return res.status(400).json({ success: false, message: 'Project already exists for this customer' })
    }
    const ref = await db.collection('projects').add({
      customerId: id,
      name: name.trim(),
      createdAt: FieldValue.serverTimestamp(),
    })
    return res.json({ success: true, id: ref.id, name: name.trim() })
  } catch (err) {
    console.error('Add project error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

router.delete('/customers/:id/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params
    const projDoc = await db.collection('projects').doc(projectId).get()
    if (!projDoc.exists) return res.status(404).json({ success: false, message: 'Project not found' })
    await db.collection('projects').doc(projectId).delete()
    return res.json({ success: true })
  } catch (err) {
    console.error('Delete project error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

module.exports = router
