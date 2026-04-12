const jwt = require('jsonwebtoken');

/**
 * Middleware: verifyToken
 * Expects: Authorization: Bearer <token>
 * Attaches decoded payload to req.admin on success.
 */
module.exports = function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'ACCESS DENIED — No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'ACCESS DENIED — Invalid or expired token.' });
  }
};
