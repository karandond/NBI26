// Vercel Serverless Function entry point.
// Vercel treats a default-exported Express app as a request handler,
// so all /api/* traffic is routed here (see backend/vercel.json).
const app = require('../app')

module.exports = app
