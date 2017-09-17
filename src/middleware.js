const query = require('./query')

function insertUserMiddleware(req, res, next) {
  if (req.session.username) {
    query.getUserByUsername(req.session.username)
    .then(user => {
      req.user = user
      res.locals.user = user
      next()
    })
  } else {
    next()
  }
}

function authMiddleware(req, res, next) {
  if (req.session.username) {
    next()
  } else {
    res.redirect('/login')
  }
}

function insertReqMiddleware(req, res, next) {
  // for use of flash message in templates
  res.locals.req = req
  next()
}

function insertTokenMiddleware(req, res, next) {
  res.locals.csrfToken = req.csrfToken()
  next()
}
module.exports = {
  authMiddleware,
  insertReqMiddleware,
  insertUserMiddleware,
  insertTokenMiddleware
}
