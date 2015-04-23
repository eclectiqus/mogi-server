var express = require('express'),
    app = module.exports = express(),
    db = require('./../db'),
    auth = require('./../auth');

app.delete('/groups/:id', auth.ensureAdmin, function(req, res) {
  db.Group.find(req.user.groupId).success(function(groupCurrent) {
    if (groupCurrent != null && groupCurrent.isAdmin === true) {

      db.Group.find(req.params.id).success(function (group) {
        if (group.id != groupCurrent.id ) {
          group.getUsers().then(function(users){
            if (users == null || users.length == 0) {
              group.destroy();
              res.send(200);
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
    db.Group.find(req.user.groupId).success(function(group){
        if (group != null && group.isAdmin === true ){
            db.Group.findAll({ order : 'name ASC'}).success(function(groups){
                res.send(groups);
            });
        } else {
            res.send([group]);
        }
    });
});

app.get('/groups/isadmin', auth.ensureAdmin, function(req, res) {
  db.Group.find(req.user.groupId).success(function(group){
    if (group != null && group.isAdmin === true ){
      res.send(true);
    } else {
      res.send(false);
    }
  });
});

app.get('/groups/:id', auth.ensureAdmin, function(req, res) {
  db.Group.find(req.user.groupId).success(function(group){
    if (group.id == req.params.id) {
      res.send(group);
    }else if (group != null && group.isAdmin === true ){
      db.Group.find(req.params.id).success(function(group){
        res.send(group);
      });
    } else {
      res.send(403);
    }
  });
});



app.post('/groups/:id', auth.ensureAdmin, function(req, res) {
  db.Group.find(req.user.groupId).success(function(group){
    if (group != null && group.isAdmin === true ){

      db.Group.find(req.params.id).success(function(group){
        group.updateAttributes(req.body).success(function(){
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
  db.Group.find(req.user.groupId).success(function(group){
    if (group != null && group.isAdmin === true ){
      db.Group
        .build({ name : req.body.name })
        .save()
        .success(function(group) {
          res.send(200, { id : group.id });
        }).error(function(err) {
          res.send(500, err);
        });
    } else {
      res.send(403);
    }
  });
});


