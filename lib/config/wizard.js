var express = require('express'),
    app = module.exports = express(),
    config = require('./../config'),
    fs = require('fs'),
    db = require('./../db'),
    auth = require('./../auth');

app.get('/config', function(req, res) {
  if ( config.configured ) {
    return res.status(400).send({ message : "Server already configured"});
  }
  res.sendfile(__dirname + '/views/wizard.html');
});

app.post('/config', function(req, res) {
  if ( config.configured ) {
    return res.status(400).send({ message : "Server already configured" });
  }

  var group = db.group.build({
    name: req.body.admin.groupName,
    lat: req.body.admin.groupLat,
    lng: req.body.admin.groupLng,
    isAdmin: true
  });

  group.save().then(function(newGroup){
    var admin = db.user.build({
      username : req.body.admin.username,
      name : req.body.admin.name,
      email : req.body.admin.email,
      isAdmin : true
    });

    admin.hashPassword(req.body.admin.password, function() {
      admin.save()
        .then(function(newAdmin) {
          newAdmin.setGroup(newGroup);
          // get the config file of the current environment
          var envJson = __dirname + '/../conf/' + process.env.NODE_ENV + '.json';

          fs.readFile(envJson, function(err, data) {
            if ( err ) return res.status(500).send( { message : "Could not load configuration file"});

            data = JSON.parse(data);
            data.configured = true;
            fs.writeFile(envJson, JSON.stringify(data, null, 2), function(err) {
              if ( err ) return res.status(500).send( { message : "Could not save configurations" });
              config.configured = true;
              res.sendStatus(200);
            });
          });
        })
        .error(function(err) {
          newGroup.destroy();
          res.status(500).send( { message : "Could not save admin user", error : err });
        });
    });
  }).error(function(err) {
    res.status(500).send( { message : "Could not save admin user", error : err });
  });
});
