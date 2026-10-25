const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  next();
};

const requireRole = (roles) => (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (!roles.includes(req.session.role)) {
    return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
  }
  next();
};

module.exports = { requireAuth, requireRole };
