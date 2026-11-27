// Protects routes that require a logged-in user.
// If not logged in, redirects to /login and remembers where the user was headed.
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  req.session.redirectTo = req.originalUrl;
  return res.redirect('/login');
};

// If already logged in, skip register/login pages and go straight to dashboard.
const redirectIfLoggedIn = (req, res, next) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  return next();
};

module.exports = { requireAuth, redirectIfLoggedIn };
