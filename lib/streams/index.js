var express = require('express'),
    app = module.exports = express(),
    db = require('./../db'),
    config = require('./../config'),
    gcm = new require('node-gcm'),
    sender = new gcm.Sender(config.googleApiKey),
    auth = require('./../auth');


app.post('/streams/:userId/start', auth.ensureAdmin, function (req, res) {
   db.user.find(req.params.userId).then(function (user) {
       sender.send(new gcm.Message({ collapseKey : "startStreaming"}), [user.gcmRegistration], 4, function(err, result) {
           if ( err || !result ) {
               res.status(500).send( { message : 'Unable to request streaming' });
           } else {
             res.status(200).send({
               message: "Waiting for user' response."
             });
           }
       });
   });
});

app.post('/streams/:userId/stop', auth.ensureAdmin, function (req, res) {
    db.user.find(req.params.userId).then(function (user) {
        sender.send(new gcm.Message({ collapseKey : "stopStreaming"}), [user.gcmRegistration], 4, function(err, result) {
            if ( err || !result ) {
                res.status(500).send( { message : 'Unable to request streaming' });
            }

            res.status(200).send( { message : 'Stream finished.'});
        });
    });
});

//app.get('/streams/:userId', auth.ensureAdmin, function(req,res) {
//  var stream = fs.createReadStream('./streams/' + req.params.userId);
//
//  stream.on('error', function() {
//    res.sendStatus(500);
//  });
//
//  stream.pipe(res);
//});
//
//app.post('/streams', auth.ensureToken, function(req,res) {
//  var callId = uuid.v4();
//  console.log("key generated: "+callId);
//  res.status(200).send( {id: callId});
//});
//
//app.delete('/streams', auth.ensureToken, function(req,res) {
//  app.get('sockets').emit('streaming:stop', { id : req.user.id });
//  res.sendStatus(200);
//});




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
