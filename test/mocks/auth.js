var auth = {};

auth.user = null;
auth.scope = null;

auth.ensureToken = function(req, res, next) {
  if ( !auth.scope || !auth.user ) return res.send(401);
  req.user = auth.user;
  req.authInfo = { scope : auth.scope };
  next();
};

auth.ensureAdmin = function(req, res, next) {
  if ( !auth.scope || !auth.user ) return res.send(401);
  req.user = auth.user;
  req.authInfo = { scope : auth.scope }
  next();
};

module.exports = auth;