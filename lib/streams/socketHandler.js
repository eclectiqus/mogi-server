module.exports = function(io,auth, streams) {
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
  io.on('connection', function(client) {
    var handshake = client.handshake;
    var token = handshake.query.auth_token || handshake.query.token;
    if (  !token ) {
      return;
    }

    auth.validateToken(token, function(err, user, info) {
      if (err) { return next(err, false); }
      if (!user) { return next(null, false); }

      console.log('-- ' + client.id + ' joined --');
      client.emit('id', client.id);

      client.on('message', function (details) {
        console.log('-- ' + details.type + ' message to --'+ details.to +' client '+details.client);
        var otherClient = io.sockets.connected[details.to];

        if (!otherClient) {
          var stream = streams.getByUserId(details.to);
          if (stream){
            details.to = stream.id;
            otherClient = io.sockets.connected[stream.id];
          } else {
            console.log('-- socket not found -- ' + details.to);
            return;
          }
        }
        delete details.to;
        details.from = client.id;
        otherClient.emit('message', details);
      });

      client.on('readyToStream', function(options) {
        console.log('-- ' + client.id + ' is ready to stream --');

        streams.addStream(client.id, options.name, user.id, user.groupId );
        io.emit('streaming:start', { id : user.id, groupId: user.groupId });
      });

      client.on('update', function(options) {
        console.log('-- ' + options + ' update --');
        streams.update(client.id, options.name, user.id, user.groupId);
      });

      function leave() {
        console.log('-- ' + client.id + ' left --');
        streams.removeStream(client.id);

      }

      client.on('disconnect', leave);
      client.on('leave', leave);
    });

  });
};
