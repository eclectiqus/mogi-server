/**
 * Module dependencies.
 */
var express = require('express')
  , http = require('http')
  , app = express()
  , server = http.createServer(app)
  , io = require('socket.io').listen(server, {origins:'*:*'})
  , passport = require('passport')
  , db = require('./lib/db')
  , config = require('./lib/config');


// Express configuration

var allowCrossDomain = function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

if (process.env.PORT == null){
    console.warn('process.env.PORT is null!');
}
app.set('port', process.env.PORT || 3000);
app.use(express.logger('dev'));
app.use(allowCrossDomain);
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(passport.initialize());
app.use(app.router);
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

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

io.configure(function() {
  io.set('log level', 1);
  //io.set("transports", ["xhr-polling"]);
  io.set('authorization', function(handshake, done) {
    if ( !handshake.query.token ) {
      return done(null, false);
    }

    auth.validateToken(handshake.query.token, function(err, user, info) {
      if (err) { return done(err, false); }
      if (!user) { return done(null, false); }
      if ( info.scope && info.scope.indexOf('admin') === -1 ) {
        return done(null, false);
      }
      done(null, true);
    });
  });
});

app.set('sockets', io.sockets);

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
