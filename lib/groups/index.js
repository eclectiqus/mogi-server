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
              res.status(403).send("Has associated users");
            }
          });
        } else {
          res.status(403).send( "Cannot delete your own group");
        }
      }).error(function (err) {
        res.status(422).send( err);
      });

    } else {
      res.sendStatus(403);
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
      res.sendStatus(403);
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
          res.status(422).send( err);
        });
      });

    } else {
      res.sendStatus(403);
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
      res.sendStatus(403);
    }
  });
});

function getLocationsByGroup(groupId, initialDate, finalDate, accuracy, res) {
  db.sequelize.query(  'SELECT "location"."id", "location"."date", "location"."lat", "location"."lng", "user"."id" '+
  'AS "userId" FROM "locations" AS "location" '+
  'LEFT OUTER JOIN "users" AS "user" '+
  'ON "location"."userId" = "user"."id" '+
  'WHERE "location"."id" IN (SELECT MAX("loc"."id") '+
  'FROM "locations" AS "loc" '+
  'JOIN "users" AS "u" ON "u"."id" = "loc"."userId" '+
  'WHERE (("u"."groupId" = ?) AND ("loc"."date" '+
  'BETWEEN ? AND ?) '+
  'AND ("loc"."accuracy" <= ? OR "loc"."accuracy" IS NULL )) '+
  'GROUP BY date_trunc(\'year\', "loc"."date"), date_trunc(\'month\', "loc"."date"), date_trunc(\'day\', "loc"."date") '+
  ',date_trunc(\'hour\', "loc"."date"), date_trunc(\'minute\', "loc"."date") '+
  ') ORDER BY "userId", "location"."date" ASC ',
    { type: db.sequelize.QueryTypes.SELECT,
      model: db.location,
      replacements: [groupId, initialDate, finalDate, accuracy]})
    .then(function (locations) {
    var response = {}, auxId = null;
    for (var i = 0; i < locations.length; i++) {
      var location = locations[i];
      if (auxId == null || auxId != location.userId) {
        auxId = location.userId;
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
  getLocationsByGroup(req.params.id, moment(req.params.date).toDate(),
    moment(req.params.date).hour(23).minute(59).seconds(59).toDate(),req.params.accuracy, res);
});


app.get('/groups/:id/locations/:initialDate/:finalDate/:accuracy', auth.ensureAdmin, function(req, res){
  getLocationsByGroup(req.params.id, moment(req.params.initialDate).toDate(),
    moment(req.params.finalDate).hour(23).minute(59).seconds(59).toDate(),req.params.accuracy, res);
});

app.get('/groups/:id/videos/from/:date', auth.ensureAdmin, function (req, res) {
  if(!moment(req.params.date).isValid()) {
    console.log('Invalid date. ['+req.params.date+']');
    return res.sendStatus(400);
  }
  var dateRange = [ moment(req.params.date).toDate(), moment(req.params.date).hour(23).minute(59).seconds(59).toDate() ];

  db.video.findAll({
    where : { date : { between : dateRange }},
    order: [['date', 'asc']],
    raw : true,
    include: [{
      model: db.user,
      where: {
        groupId: req.params.id
      },
      required: true
    }]
  })

    .then(function(videos) {
      var result = [];
      videos.forEach(function(video) {
        result.push({
          id : video.id,
          from : moment(video.date).toISOString(),
          to : moment(video.date).add('seconds', video.duration).toISOString(),
          userId: video.userId
        });
      });

      res.send(result);
    });
});

app.get('/groups/:id/videos/from/:initialDate/:finalDate', auth.ensureAdmin, function (req, res) {
  if(!moment(req.params.initialDate).isValid() || !moment(req.params.finalDate).isValid()) {
    console.log('Invalid dates. initial=['+req.params.initialDate+'] and final=['+req.params.finalDate+']');
    return res.sendStatus(400);
  }
  if(moment(req.params.initialDate).isAfter(moment(req.params.finalDate).toDate())){
    console.log('Invalid range. initial=['+req.params.initialDate+'] and final=['+req.params.finalDate+']');
    return res.sendStatus(400);
  }
  var dateRange = [ moment(req.params.initialDate).toDate(), moment(req.params.finalDate).toDate() ];

  db.video.findAll({
    where : { date : { between : dateRange }},
    order: [['date', 'asc']],
    raw : true,
    include: [{
      model: db.user,
      where: {
        groupId: req.params.id
      },
      required: true
    }]
  })

    .then(function(videos) {
      var result = [];
      videos.forEach(function(video) {
        result.push({
          id : video.id,
          from : moment(video.date).toISOString(),
          to : moment(video.date).add('seconds', video.duration).toISOString(),
          userId: video.userId
        });
      });

      res.send(result);
    });
});



