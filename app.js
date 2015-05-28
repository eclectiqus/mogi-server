/**
 * Module dependencies.
 */
var express = require('express')
  , http = require('http')
  , app = express()
  , server = http.createServer(app)
  , io = require('socket.io')(server, {origins:'*:*'})
  , passport = require('passport')
  , db = require('./lib/db')
  , config = require('./lib/config')
  , cookieParser = require('cookie-parser')
  , logger = require('morgan')
  , methodOverride = require('method-override')
  , errorHandler = require('errorhandler')
  , bodyParser = require('body-parser')
  ,	streams = require('./lib/streams/streams.js')();


// Express configuration

var allowCrossDomain = function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.sendStatus(200);
    }
    else {
      next();
    }
};

if (process.env.PORT == null){
    console.warn('process.env.PORT is null!');
}
app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(allowCrossDomain);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(passport.initialize());
if ('development' == app.get('env')) {
  app.use(errorHandler({dumpExceptions: true, showStack: true}));
}

// Passport configuration
var auth = require('./lib/auth');

app.post('/token', auth.tokenEndpoint);
app.use(require('./lib/config/wizard'));
app.use(require('./lib/users'));
app.use(require('./lib/streams'));
app.use(require('./lib/videos'));
app.use(require('./lib/locations'));
app.use(require('./lib/histories'));
app.use(require('./lib/groups'));
app.use(require('./lib/pictures'));

io.use(function(socket, next){
  var handshake = socket.request;
  if (  !handshake._query.token ) {
      return next(null, false);
    }

    auth.validateToken(handshake._query.token, function(err, user, info) {
      if (err) { return next(err, false); }
      if (!user) { return next(null, false); }
      if ( info.scope && info.scope.indexOf('admin') === -1 ) {
        return next(null, false);
      }
      next(null, true);
    });

  next();
});

app.set('sockets', io.sockets);
app.set('streams', streams);

//{force: true}
db.sequelize.sync().complete(function(err) {
  if (err) {
    throw err;
  } else {
    server.listen(app.get('port'), function(){
      console.log('Express server listening on port ' + app.get('port'));
    });
  }
});
