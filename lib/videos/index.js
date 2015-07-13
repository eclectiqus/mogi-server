var express = require('express'),
    app = module.exports = express(),
    db = require('./../db'),
    auth = require('./../auth'),
    storage = require('./storage'),
    formidable = require('formidable'),
    Metalib = require('fluent-ffmpeg').Metadata,
    moment = require('moment'),
    uuid = require('node-uuid');

app.post('/videos', auth.ensureToken, function (req, res) {
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    if ( err ) {
      return res.status(500).send( { message : 'Could not upload video.', error : err });
    }

    var videoFile = files.video;
    //var audioFile = files.audio;
    var dateRecorded = moment(fields.date);

    // get metadata. this is good check to see if the video is valid
    new Metalib(videoFile.path, function(metadata, err) {
      if ( err ) return res.status(500).send( { message : 'Invalid video'});


      db.video.create({ id: uuid.v4(), date : dateRecorded.toISOString(), duration : metadata.durationsec })
        .then(function(video) {
          video.setUser(req.user);
          storage.createVideoStream(videoFile.path, video, metadata,function(streamError) {
            if ( streamError ) {
              video.destroy();
              console.log('STREAMERR:', streamError.message);
              res.status(500).send( { message : 'Unable to store video' });
            } else {
              res.sendStatus(201);
            }
          });
        });
    });
  });
});

app.post('/videos/:user', auth.ensureToken, function (req, res) {
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
        if ( err ) {
            return res.status(500).send( { message : 'Could not upload video.', error : err });
        }

        res.sendStatus(201);

        var videoFile = files.video;
        //var audioFile = files.audio;
        var dateRecorded = moment(fields.date);

        // get metadata. this is good check to see if the video is valid
        new Metalib(videoFile.path, function(metadata, err) {
          if (err || !metadata) {
            console.log('err processing metadata. err=[' + err + ']');
            return;
            //res.status(500).send( { message : 'Invalid video'});
          }
          if (!metadata.durationsec || metadata.durationsec <= 0) {
            console.log('metadata.durationsec=[' + metadata.durationsec + ']');
          }

            db.user.findOne({where: {username: req.params.user}}).then(function(user) {
                db.video.create({ id: uuid.v4(), date: dateRecorded.toISOString(), duration: metadata.durationsec})
                    .then(function (video) {
                        video.setUser(user);
                        try{
                          storage.createVideoStream(videoFile.path, video, metadata, function (streamError) {
                            if (streamError) {
                              video.isValid = false;
                              video.save();
                              console.log('STREAMERR:', streamError.message);
                            }
                          });
                        }catch(ex){
                          console.log('exception creating stream=[' + ex + ']');
                        }
                    });
            });
        });
    });
});
