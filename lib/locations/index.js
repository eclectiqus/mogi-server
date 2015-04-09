var express = require('express'),
    app = module.exports = express(),
    moment = require('moment'),
    db = require('./../db'),
    _ = require('lodash'),
    auth = require('./../auth'),
    Sequelize = require('sequelize'),
    config = require('./../config'),
    sequelize = new Sequelize(config.db, { dialect : 'postgres', logging: false, omitNull: true/*,logging: console.log*/ });

app.post('/locations', auth.ensureToken, function(req,res) {
  if ( !(req.body instanceof Array) ) {
    req.user.lastLat = req.body.lat;
    req.user.lastLng = req.body.lng;
    req.user.lastLocationUpdateDate = req.body.date = new Date();
    req.user.save();
    var location = db.Location.build({
      lat: req.body.lat,
      lng: req.body.lng,
      date: req.body.date,
      accuracy: req.body.accuracy,
      satellites: req.body.satellites,
      provider: req.body.provider,
      bearing: req.body.bearing,
      speed: req.body.speed
    });

    location.save().success(function(){
        location.setUser(req.user);
    });
    app.get('sockets').emit('users:location', { id : req.user.id, name: req.user.name, username: req.user.username,
        lat: req.body.lat, lng: req.body.lng, groupId: req.user.groupId, accuracy: req.body.accuracy,
        streamUrl: "rtmp://"+config.wowza.ipAddress+":"+config.wowza.port+config.wowza.path+req.user.id+".stream"});
    req.body = [req.body];
    res.send(200);
  } else {

      _.forEach(req.body, function(loc) {
        loc.userId = req.user.id;
      });

      db.Location.bulkCreate(req.body)
        .success(function(result) {
          res.send(200);
        }).error(function(err) {
          console.log(err);
          res.send(500);
        });
  }
});

app.post('/locations/:user', auth.ensureToken, function(req,res) {
    db.User.find({where: {username: req.params.user}}).success(function(user){
      if (user == null){
        res.send(404);
      } else {
          _.forEach(req.body, function (loc) {
            loc.userId = user.id;
          });

          db.Location.bulkCreate(req.body)
            .success(function (result) {
              res.send(200);
            }).error(function (err) {
              console.log(err);
              res.send(500);
            });
        }
    });
});

app.get('/users/:id/locations/:date', auth.ensureAdmin, function(req,res) {
    var dateRange = [ moment(req.params.date).toDate(), moment(req.params.date).hour(23).minute(59).seconds(59).toDate() ];

    db.Location.findAll({order:'date ASC', where : { date : { between : dateRange }, userId : req.params.id }, attributes : ['lat','lng','date'] },{ raw : true })
        .success(function(locations) {
            var locationJson = JSON.stringify(locations);

            res.send(locationJson);
        }).error(function(err) {
            console.log(err);
            res.send(500);
        });
});

app.get('/users/:id/locations/:date/:accuracy', auth.ensureAdmin, function(req,res) {
    var dateRange = [ moment(req.params.date).toDate(), moment(req.params.date).hour(23).minute(59).seconds(59).toDate() ];

    db.Location.findAll({order:'date ASC',
            where:
            Sequelize.and({date : { between : dateRange }},
                Sequelize.and({userId : req.params.id}),
                Sequelize.or(
                    {accuracy : []},
                    {accuracy : {lte:req.params.accuracy}}
                ))
            ,
            attributes : ['lat','lng','date'] },
        { raw : true }
    )
        .success(function(locations) {
            var locationJson = JSON.stringify(locations);

            res.send(locationJson);
        }).error(function(err) {
            console.log(err);
            res.send(500);
        });
});

app.get('/users/:id/dates/enabled', auth.ensureAdmin, function(req,res) {
    var where = ['"userId"= ?'],
        params = [],
        select = ['SELECT CAST(CAST(date AS DATE) as VARCHAR(32)) ENABLED_DATES FROM locations'];
    params.push(req.params.id);
    var query = select.join(' ') + ((where.length > 0) ? ' WHERE ' + where.join(' AND ') : '') + ' GROUP BY CAST(CAST(date AS DATE) as VARCHAR(32)) ORDER BY CAST(CAST(date AS DATE) as VARCHAR(32)) ASC';
    db.sequelize.query(query, null, { logging : console.log, raw : true }, params).success(function(result) {
        res.send(result);
    }).error(function(err) {
        console.log(err);
        res.send(500);
    });
});
