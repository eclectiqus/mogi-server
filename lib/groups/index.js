var express = require('express'),
    app = module.exports = express(),
    db = require('./../db'),
    auth = require('./../auth')
    Sequelize = require('sequelize');

app.delete('/groups/:id', auth.ensureAdmin, function(req, res) {
  db.group.findById(req.user.groupId).then(function(groupCurrent) {
    if (groupCurrent != null && groupCurrent.isAdmin === true) {

      db.group.findById(req.params.id).then(function (group) {
        if (group.id != groupCurrent.id ) {
          group.getUsers().then(function(users){
            if (users == null || users.length == 0) {
              group.destroy();
              res.sendStatus(200);
            } else {
              res.send(403, "Has associated users");
            }
          });
        } else {
          res.send(403, "Cannot delete your own group");
        }
      }).error(function (err) {
        res.send(422, err);
      });

    } else {
      res.send(403);
    }
  });
});

app.get('/groups', auth.ensureAdmin, function(req, res) {
    db.group.findById(req.user.groupId).then(function(group){
        if (group != null && group.isAdmin === true ){
            db.group.findAll({ order : 'name ASC'}).then(function(groups){
                res.send(groups);
            });
        } else {
            res.send([group]);
        }
    });
});

app.get('/groups/isadmin', auth.ensureAdmin, function(req, res) {
  db.group.findById(req.user.groupId).then(function(group){
    if (group != null && group.isAdmin === true ){
      res.send(true);
    } else {
      res.send(false);
    }
  });
});

app.get('/groups/:id', auth.ensureAdmin, function(req, res) {
  db.group.findById(req.user.groupId).then(function(group){
    if (group.id == req.params.id) {
      res.send(group);
    }else if (group != null && group.isAdmin === true ){
      db.group.findById(req.params.id).then(function(group){
        res.send(group);
      });
    } else {
      res.send(403);
    }
  });
});



app.post('/groups/:id', auth.ensureAdmin, function(req, res) {
  db.group.findById(req.user.groupId).then(function(group){
    if (group != null && group.isAdmin === true ){

      db.group.findById(req.params.id).then(function(group){
        group.updateAttributes(req.body).then(function(){
          res.send(group);
        }).error(function(err) {
          res.send(422, err);
        });
      });

    } else {
      res.send(403);
    }
  });
});

app.post('/groups', auth.ensureAdmin, function(req, res) {
  db.group.findById(req.user.groupId).then(function(group){
    if (group != null && group.isAdmin === true ){
      db.group
        .build({ name : req.body.name })
        .save()
        .then(function(group) {
          res.status(200).send( { id : group.id });
        }).error(function(err) {
          res.status(500).send( err);
        });
    } else {
      res.send(403);
    }
  });
});

function getLocationsByGroup(req, dateRange, res) {
  db.location.findAll({
    attributes: ['date', 'lat', 'lng'],
    where: Sequelize.and(['"groupId" = ?', req.params.id], Sequelize.and({
        date: {between: dateRange}
      }),
      Sequelize.and({accuracy: {lte: req.params.accuracy}})),
    order: ['userId', ['date', 'ASC']],
    include: {model: db.user, attributes: ['id']}
  }).then(function (locations) {
    var response = {}, auxId = null;
    for (var i = 0; i < locations.length; i++) {
      var location = locations[i];
      if (auxId == null || auxId != location.user.id) {
        auxId = location.user.id;
        response[auxId] = [];
      }
      response[auxId].push(location);
    }
    res.send(response);
  }).error(function (err) {
    console.log(err);
    res.sendStatus(500);
  });
}

app.get('/groups/:id/locations/:date/:accuracy', auth.ensureAdmin, function(req, res){
  var dateRange = [ moment(req.params.date).toDate(), moment(req.params.date).hour(23).minute(59).seconds(59).toDate() ];
  getLocationsByGroup(req, dateRange, res);
});


app.get('/groups/:id/locations/:initialDate/:finalDate/:accuracy', auth.ensureAdmin, function(req, res){
  var dateRange = [ moment(req.params.initialDate).toDate(), moment(req.params.finalDate).hour(23).minute(59).seconds(59).toDate() ];
  getLocationsByGroup(req, dateRange, res);
});



