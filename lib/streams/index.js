var express = require('express'),
    app = module.exports = express(),
    db = require('./../db'),
    fs = require('fs'),
    config = require('./../config'),
    gcm = new require('node-gcm'),
    sender = new gcm.Sender(config.googleApiKey),
    auth = require('./../auth');

app.post('/streams/:userId/start', auth.ensureAdmin, function (req, res) {
   db.User.find(req.params.userId).success(function (user) {
       sender.send(new gcm.Message({ collapseKey : "startStreaming"}), [user.gcmRegistration], 4, function(err, result) {
           if ( err || !result ) {
               res.status(500).send( { message : 'Unable to request streaming' });
           }

           res.status(200).send( {
               message : 'Stream requested.',
               streamUrl: "rtmp://"+config.wowza.ipAddress+":"+config.wowza.port+config.wowza.path+req.params.userId+".stream"
               //maybe its unnused the property streamUrl on this endpoint
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
    /**
     * we`ll check if there is any admin online of the user group.<br>
     *     If there is, 200
     *     if there is no admin online, send either !200 or a 200 with a jSon warning the client
     *     that there is no admin online, so the app can stop streaming and start recording on the sdCard.
     */
    res.status(200).send( {
        message: "Stream sent"
    });
    app.get('sockets').emit('streaming:start', { id : req.user.id, groupId: req.user.groupId });
});

app.delete('/streams', auth.ensureToken, function(req,res) {
  res.sendStatus(200);
  app.get('sockets').emit('streaming:stop', { id : req.user.id });
});
