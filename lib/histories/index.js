var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  auth = require('./../auth'),
  _ = require('lodash'),
  config = require('./../config');

app.post('/histories', auth.ensureToken, function(req,res) {
  if ( !(req.body instanceof Array) ) {
    var history = db.history.build({
      previousState: req.body.previousState,
      nextState: req.body.nextState,
      date: req.body.date
    });

    history.setUser(req.user, {save:false});
    history.save().then(function () {
      res.sendStatus(200);
    });

  } else {

    _.forEach(req.body, function(hist) {
      hist.userId = req.user.id;
    });

    db.history.bulkCreate(req.body)
      .then(function(result) {
        res.sendStatus(200);
      }).error(function(err) {
        console.log(err);
        res.sendStatus(500);
      });
  }
});

app.post('/histories/:user', auth.ensureToken, function(req,res) {
  db.user.find({where: {username: req.params.user}}).then(function(user){
    if (user == null){
      res.sendStatus(404);
    } else {
      if (!(req.body instanceof Array)) {
        var history = db.history.build({
          previousState: req.body.previousState,
          nextState: req.body.nextState,
          date: req.body.date
        });

        history.save().then(function () {
          history.setUser(user);
        });
        res.sendStatus(200);
      } else {

        _.forEach(req.body, function (hist) {
          hist.userId = user.id;
        });

        db.history.bulkCreate(req.body)
          .then(function (result) {
            res.sendStatus(200);
          }).error(function (err) {
            console.log(err);
            res.sendStatus(500);
          });
      }
    }
  });
});

