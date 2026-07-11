/**
 * One-off script to insert an admin user into Firestore
 * with a bcrypt-hashed password.
 *
 * Usage:
 *   node seedUser.js
 *
 * Edit the EMAIL / PASSWORD / ROLE constants below before running,
 * or wire this up to read from process.argv if you seed often.
 */
require('dotenv').config()
const bcrypt = require('bcrypt')
const { db, admin } = require('./src/firebase')

const EMAIL = 'admin@test.com'
const PASSWORD = 'admin123'
const ROLE = 'admin'
const SALT_ROUNDS = 10

async function seed() {
  try {
    const existing = await db.collection('users').where('email', '==', EMAIL).limit(1).get()

    if (!existing.empty) {
      console.log(`User ${EMAIL} already exists. Skipping.`)
      process.exit(0)
    }

    const hashedPassword = await bcrypt.hash(PASSWORD, SALT_ROUNDS)

    await db.collection('users').add({
      email: EMAIL,
      password: hashedPassword,
      role: ROLE,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    console.log(`Seeded user: ${EMAIL} / ${PASSWORD} (role: ${ROLE})`)
    process.exit(0)
  } catch (err) {
    console.error('Seeding failed:', err)
    process.exit(1)
  }
}

seed()
