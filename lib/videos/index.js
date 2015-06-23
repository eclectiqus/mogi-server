var express = require('express'),
    app = module.exports = express(),
    db = require('./../db'),
    auth = require('./../auth'),
    storage = require('./storage'),
    formidable = require('formidable'),
    Metalib = require('fluent-ffmpeg').Metadata,
    moment = require('moment'),
    uuid = require('node-uuid');

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
          to : moment(video.date).add('seconds', video.duration).toISOString()
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
          to : moment(video.date).add('seconds', video.duration).toISOString()
        });
      });

      res.send(result);
    });
});

app.get('/users/:id/videos/from/:date', auth.ensureAdmin, function (req, res) {
  var dateRange = [ moment(req.params.date).toDate(), moment(req.params.date).hour(23).minute(59).seconds(59).toDate() ];

  db.video.findAll({
      where : { date : { between : dateRange }, userId : req.params.id },
      raw : true,
      order: [['date', 'asc']]
  })

    .then(function(videos) {
      var result = [];
      videos.forEach(function(video) {
        result.push({
          id : video.id,
          from : moment(video.date).toISOString(),
          to : moment(video.date).add('seconds', video.duration).toISOString()
        });
      });

      res.send(result);
    });
});

app.get('/users/:id/videos/:video.:format', function (req, res) {
  db.video.find({where: {id: req.params.video}}).then(function(video) {
    if (!video) return res.send(404);
      var totalSize = 0;
      try{
          totalSize = storage.getTotalSize(video);
      }catch(err){
          console.log('video not found on storage.');
          res.send(404);
          return;
      }

      if (req.headers['range']) {
          var range = req.headers.range
              , parts = range.replace(/bytes=/, "").split("-")
              , partialstart = parts[0]
              , partialend = parts[1]
              , start = parseInt(partialstart, 10)
              , end = partialend ? parseInt(partialend, 10) : totalSize-1
              , chunksize = (end-start)+1

          console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize)

          storage.readVideoStream(video,function(err, stream) {
          //var file = fs.createReadStream(path, {start: start, end: end})

              res.writeHead(206
                  , { 'Content-Range': 'bytes ' + start + '-' + end + '/' + totalSize
                  , 'Accept-Ranges': 'bytes', 'Content-Length': chunksize
                  , 'Content-Type': 'video/mp4'
              })
              stream.pipe(res)
          }, {start: start, end: end});
      } else {
          storage.readVideoStream(video, function(err, stream) {
              if ( err ) return res.sendStatus(500);
              res.writeHead(206
                  , {'Content-Type': 'video/mp4'
                  })
              stream.pipe(res);
              stream.on('error', function() {
                  res.sendStatus(500);
              });
          });
      }
  });
});

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
