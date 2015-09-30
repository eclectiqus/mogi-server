var path = require('path'),
    fs = require('node-fs'),
    FFmpeg = require('fluent-ffmpeg'),
    mv = require('mv'),
    db = require('../../db'),
    crypto = require('../../crypto'),
    uuid = require('node-uuid');


var basePath = path.resolve(__dirname, '../../../videos') + '/';
exports.createVideoStream = function(sourcePath, video, metadata, callback) {
  var finalVideoPath = basePath + video.videoPath();
  var finalAudioPath = basePath + video.audioPath();
  fs.mkdir(path.dirname(finalVideoPath), 0777, true, function(err) {
      if ( err ) return callback(err, null);

      if(!metadata || (!metadata.format && !metadata.durationsec)){
          var err = new Object();
          err.message = 'Could not find metadata. Moving raw file';
          mv(sourcePath, finalVideoPath, function(err) {
            //expected
        });
        callback(err);
        return;
      }
      var ffmpeg = new FFmpeg({ source: sourcePath });

      var vid_output_stream = fs.createWriteStream(finalVideoPath);

      var outpipe = ffmpeg.on('error', function(err, stdout, stderr) {
          console.log("ffmpeg stdout:\n" + stdout);
          console.log("ffmpeg stderr:\n" + stderr);

          console.log('Cannot process video: ' + err.message);
          callback(err);
          return;
      }).on('end', function() {
          // The 'end' event is emitted when FFmpeg finishes
          // processing.
      });

      outpipe.noAudio().format('mp4').outputOptions('-movflags frag_keyframe+empty_moov').pipe().pipe(crypto.encryptor()).pipe(vid_output_stream);
      console.log('fim enc.')
  });

  fs.mkdir(path.dirname(finalAudioPath), 0777, true, function(err) {
    if ( err ) return callback(err, null);
    var ffmpeg = new FFmpeg({ source: sourcePath });

    var outpipe = ffmpeg.on('error', function(err, stdout, stderr) {
      console.log('Cannot process audio: ' + err.message);
      callback(err);
      return;
    }).on('end', function() {
      // The 'end' event is emitted when FFmpeg finishes
      // processing.
      console.log('Processing finished successfully');
    });

    var output_stream = fs.createWriteStream(finalAudioPath);
    outpipe.noVideo().format('mp4').outputOptions('-movflags frag_keyframe+empty_moov').pipe().pipe(crypto.encryptor()).pipe(output_stream);

    callback(null);
  });
};


exports.readVideoStream = function(video, callback, options) {

  var x = fs.createReadStream(basePath + video.videoPath()).pipe(crypto.decryptor(), options);

  callback(null, x);
};

exports.getTotaDuration = function(video, callback){
    var path = basePath + video.videoPath();
    FFmpeg.ffprobe(path, function (err, metadata) {
        if (err){
            callback.call(video,0);
            return;
        }
        if (metadata.format){
            callback.call(video,metadata.format.duration);
            return;
        } else if (metadata.durationsec) {
            callback.call(video,metadata.durationsec);
            return;
        }
        callback.call(video,0);
    });
};

exports.exists = function(video){
    return(fs.existsSync(basePath + video.videoPath()));
};


exports.ingestVideo = function(rawVideoPath, username, dateRecorded, callback) {

  db.user.findOne({where: {username: username}}).then(function (user) {
    if (!user) {
      callback.call(404);
      return;
    }

    FFmpeg.ffprobe(rawVideoPath, function (err, metadata) {
      if (err) {
        console.log(err);
        callback.call(500);
        return;
      }

      if (!metadata) {
        console.log('WARNING: could not read metadata')
        //por enquanto vamos abortar neste caso
        callback.call(500);
        return;
      }

      var videosize = fs.statSync(rawVideoPath).size;

      if (metadata.format)
        duration = Math.ceil(metadata.format.duration);
      else
        duration = metadata.durationsec;

      db.video.create({id: uuid.v4(), date: dateRecorded.toISOString(), duration: duration, filesize: videosize})
        .then(function(video) {

          video.setUser(user);

          try {

            var ffmpeg = new FFmpeg({source: rawVideoPath});
            var vid_output_stream = fs.createWriteStream(basePath + video.videoPath());

            var outpipe = ffmpeg.on('error', function (err, stdout, stderr) {
              console.log(err);
              callback(500);
              return;
            });

            vid_output_stream.on('finish', function(){
              fs.unlinkSync(rawVideoPath);
              callback.call(201);
              return;
            }).on('error', function() {
              console.log(err);
              callback.call(201);
              return;
            });

            outpipe.noAudio().format('mp4').outputOptions('-movflags frag_keyframe+empty_moov').pipe().pipe(crypto.encryptor()).pipe(vid_output_stream);

          } catch(ex) {
            video.isValid = false;
            video.save();
            console.log(ex)
            callback.call(500);
            return;
          }
      }).catch(function() {
          console.log('falhou insert');
          callback.call(500);
          return;
      });

    });
  });
};
