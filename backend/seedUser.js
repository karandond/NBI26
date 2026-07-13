/**
 * Create a user in Firestore with a bcrypt-hashed password.
 *
 * Usage:
 *   node seedUser.js <email> <password> [role]
 *
 * Examples:
 *   node seedUser.js john@example.com secret123
 *   node seedUser.js jane@example.com pass456 admin
 */
require('dotenv').config()
const bcrypt = require('bcrypt')
const { db, admin } = require('./src/firebase')

const [,, EMAIL, PASSWORD, ROLE = 'user'] = process.argv

if (!EMAIL || !PASSWORD) {
  console.error('Usage: node seedUser.js <email> <password> [role]')
  console.error('Example: node seedUser.js john@example.com secret123 admin')
  process.exit(1)
}

const SALT_ROUNDS = 10

async function seed() {
  try {
    const existing = await db.collection('users').where('email', '==', EMAIL).limit(1).get()

    if (!existing.empty) {
      console.log(`User ${EMAIL} already exists. Skipping.`)
      process.exit(0)
    }

    const hashedPassword = await bcrypt.hash(PASSWORD, SALT_ROUNDS)

    const doc = await db.collection('users').add({
      email: EMAIL,
      password: hashedPassword,
      role: ROLE,
      status: 'approved',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    console.log(`Created user: ${EMAIL} | role: ${ROLE} | id: ${doc.id}`)
    process.exit(0)
  } catch (err) {
    console.error('Failed:', err)
    process.exit(1)
  }
}

seed()
