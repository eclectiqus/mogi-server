var express = require('express'),
    app = module.exports = express(),
    db = require('./../db'),
    fs = require('fs'),
    config = require('./../config'),
    uuid = require('node-uuid'),
    gcm = new require('node-gcm'),
    sender = new gcm.Sender(config.googleApiKey),
    auth = require('./../auth');

app.post('/streams/message', auth.ensureToken, function(req,res) {

  if (!req.body.to) {
    res.sendStatus(404);
    return;
  }

  //delete req.body.to;


  var stream = app.get("streams").getStream(req.body.to);
  if (!stream) {
    res.sendStatus(404);
    return;
  }

  if (stream.name === "android_name"){
    sender.send(new gcm.Message({ collapseKey : "message", to: req.body.to, type: req.body.type, payload: req.body.payload}), [stream.user.gcmRegistration], 4, function(err, result) {
      if ( err || !result ) {
        res.status(500).send( { message : 'Unable to send message' });
      }

      res.sendStatus(200);
    });
  } else {
    app.get('socket').emit('message', {
      to: req.body.to,
      type: req.body.type,
      payload: req.body.payload
    });
    res.sendStatus(200);
  }

});

app.post('/streams/readyToStream', auth.ensureToken, function(req,res) {

  var id = req.body.callId;

  app.get('streams').addStream(id, req.body.name, req.user);

  app.get('sockets').emit('streaming:start', { id : req.user.id, groupId: req.user.groupId, callId: id });

  res.sendStatus(200);
});

app.post('/streams/:userId/start', auth.ensureAdmin, function (req, res) {
   db.User.find(req.params.userId).success(function (user) {
       sender.send(new gcm.Message({ collapseKey : "startStreaming"}), [user.gcmRegistration], 4, function(err, result) {
           if ( err || !result ) {
               res.status(500).send( { message : 'Unable to request streaming' });
           }

           res.status(200).send( {
               message : 'Stream requested.'
           });
       });
   });
});

app.post('/streams/:userId/stop', auth.ensureAdmin, function (req, res) {
    db.User.find(req.params.userId).success(function (user) {
        sender.send(new gcm.Message({ collapseKey : "stopStreaming"}), [user.gcmRegistration], 4, function(err, result) {
            if ( err || !result ) {
                res.status(500).send( { message : 'Unable to request streaming' });
            }

            res.status(200).send( { message : 'Stream finished.'});
        });
    });
});

app.get('/streams/:userId', auth.ensureAdmin, function(req,res) {
  var stream = fs.createReadStream('./streams/' + req.params.userId);

  stream.on('error', function() {
    res.sendStatus(500);
  });

  stream.pipe(res);
});

app.post('/streams', auth.ensureToken, function(req,res) {
  var callId = uuid.v4();
  console.log("key generated: "+callId);
  res.status(200).send( {id: callId});
});

app.delete('/streams', auth.ensureToken, function(req,res) {
  res.sendStatus(200);
  app.get('sockets').emit('streaming:stop', { id : req.user.id });
});




//client.on('update', function(options) {
//  streams.update(client.id, options.name);
//});
//
//function leave() {
//  console.log('-- ' + client.id + ' left --');
//  streams.removeStream(client.id);
//}
//
//client.on('disconnect', leave);
//client.on('leave', leave);
