const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const Message = require('../models/Message');

// Validate required env vars at startup — fail fast rather than silently
if (!process.env.ADMIN_PASSWORD) {
  console.error('[AdminController] FATAL: ADMIN_PASSWORD is not set in .env');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('[AdminController] FATAL: JWT_SECRET is not set in .env');
  process.exit(1);
}

// Hash the env password once at startup (constant-time compare per-request)
const ADMIN_USERNAME  = 'admin';
const ADMIN_PASS_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);

/* ── POST /api/admin/login ─────────────────────────────────────────────────
   Body: { username, password }
   Returns: { token }                                                        */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const usernameOk = username === ADMIN_USERNAME;
    const passwordOk = await bcrypt.compare(password, ADMIN_PASS_HASH);

    if (!usernameOk || !passwordOk) {
      // Always return the same error to prevent enumeration
      return res.status(401).json({ error: 'AUTHENTICATION FAILED — Invalid credentials.' });
    }

    const token = jwt.sign(
      { role: 'admin', sub: ADMIN_USERNAME },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({ token });
  } catch (err) {
    console.error('[AdminController] login error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/* ── GET /api/admin/telemetry ──────────────────────────────────────────────
   Protected by verifyToken middleware.
   Returns: { totalDrops, recentDrops }                                      */
const getTelemetry = async (req, res) => {
  try {
    const [count, recentDrops] = await Promise.all([
      Message.countDocuments({}),
      Message.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(), // plain JS objects — faster than full Mongoose docs
    ]);

    return res.status(200).json({ totalDrops: count, recentDrops });
  } catch (err) {
    console.error('[AdminController] getTelemetry error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve telemetry.' });
  }
};

module.exports = { login, getTelemetry };
