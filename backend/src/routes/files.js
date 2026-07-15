const express  = require('express')
const multer   = require('multer')
const path     = require('path')
const fs       = require('fs')
const { FieldValue } = require('firebase-admin/firestore')
const { db } = require('../firebase')

const router = express.Router()

// ── Disk storage ──────────────────────────────────────────
// Uses /tmp on Vercel (ephemeral) or local uploads/ dir in development
const UPLOADS_DIR = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '../../uploads')

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(UPLOADS_DIR, req.params.projectId)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename(req, file, cb) {
    const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, `${Date.now()}_${safe}`)
  },
})

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } })

// ── Project access middleware ─────────────────────────────
async function checkProjectAccess(req, res, next) {
  try {
    const { projectId } = req.params
    const projDoc = await db.collection('projects').doc(projectId).get()
    if (!projDoc.exists) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }
    if (req.user.role === 'admin') {
      req.project = { id: projectId, ...projDoc.data() }
      return next()
    }
    const userDoc = await db.collection('users').doc(req.user.id).get()
    const userCustomerId = userDoc.data()?.customerId
    if (!userCustomerId || userCustomerId !== projDoc.data().customerId) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    req.project = { id: projectId, ...projDoc.data() }
    next()
  } catch (err) {
    console.error('Project access check error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── List files ────────────────────────────────────────────
router.get('/:projectId/files', checkProjectAccess, async (req, res) => {
  try {
    const snap = await db.collection('files')
      .where('projectId', '==', req.params.projectId)
      .get()

    const files = snap.docs
      .map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        size: doc.data().size,
        type: doc.data().type,
        createdAt: doc.data().createdAt?.toDate?.() || null,
        uploadedBy: doc.data().uploadedBy,
      }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    return res.json({ success: true, files })
  } catch (err) {
    console.error('List files error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

// ── Upload files ──────────────────────────────────────────
router.post('/:projectId/files', checkProjectAccess, upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files provided' })
    }

    const uploaded = []
    for (const file of req.files) {
      const ref = await db.collection('files').add({
        projectId:   req.params.projectId,
        name:        file.originalname,
        size:        file.size,
        type:        file.mimetype,
        diskPath:    file.path,
        uploadedBy:  req.user.id,
        createdAt:   FieldValue.serverTimestamp(),
      })
      uploaded.push({ id: ref.id, name: file.originalname, size: file.size, type: file.mimetype })
    }

    return res.json({ success: true, files: uploaded })
  } catch (err) {
    console.error('Upload error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

// ── Download file ─────────────────────────────────────────
router.get('/:projectId/files/:fileId/download', checkProjectAccess, async (req, res) => {
  try {
    const fileDoc = await db.collection('files').doc(req.params.fileId).get()
    if (!fileDoc.exists || fileDoc.data().projectId !== req.params.projectId) {
      return res.status(404).json({ success: false, message: 'File not found' })
    }

    const { diskPath, name, type } = fileDoc.data()

    if (!fs.existsSync(diskPath)) {
      return res.status(404).json({ success: false, message: 'File no longer exists on server' })
    }

    res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(name)}"`)
    res.set('Content-Type', type || 'application/octet-stream')
    fs.createReadStream(diskPath).pipe(res)
  } catch (err) {
    console.error('Download error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

// ── Delete file ───────────────────────────────────────────
router.delete('/:projectId/files/:fileId', checkProjectAccess, async (req, res) => {
  try {
    const fileDoc = await db.collection('files').doc(req.params.fileId).get()
    if (!fileDoc.exists || fileDoc.data().projectId !== req.params.projectId) {
      return res.status(404).json({ success: false, message: 'File not found' })
    }

    const { diskPath } = fileDoc.data()
    if (diskPath && fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath)
    }
    await db.collection('files').doc(req.params.fileId).delete()

    return res.json({ success: true })
  } catch (err) {
    console.error('Delete file error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

module.exports = router
