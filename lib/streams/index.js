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
               message: "Waiting for user's response."
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


