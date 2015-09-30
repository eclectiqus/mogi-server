var path = require('path'),
    fs = require('node-fs'),
    FFmpeg = require('fluent-ffmpeg'),
    mv = require('mv'),
    db = require('../../db'),
    crypto = require('../../crypto'),
    uuid = require('node-uuid');


var basePath = path.resolve(__dirname, '../../../videos') + '/';
var watermarkPath90 = path.resolve(__dirname, '../../../images') + '/watermark_90.png';
var watermarkPath = path.resolve(__dirname, '../../../images') + '/watermark.png';
var watermarkPath180 = path.resolve(__dirname, '../../../images') + '/watermark_180.png';
var watermarkPath270 = path.resolve(__dirname, '../../../images') + '/watermark_270.png';

exports.readVideoStream = function(video, callback, options) {

  var x = fs.createReadStream(basePath + video.encVideoPath()).pipe(crypto.decryptor(), options);

  callback(null, x);
};

exports.getTotaDuration = function(video, callback){
    var path = basePath + video.envVideoPath();
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
    return(fs.existsSync(basePath + video.encVideoPath()));
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
            var vid_output_stream = fs.createWriteStream(basePath + video.encVideoPath());

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

            outpipe.noAudio();

            if (metadata.streams[0] && metadata.streams[0].tags.rotate == 90) {
              outpipe = outpipe.addOption('-vf', 'movie=' + watermarkPath90 + ' [watermark]; [in] [watermark] overlay=(main_w-overlay_w):0 [out]');
            } else if (metadata.streams[0] && metadata.streams[0].tags.rotate == 180) {
              outpipe = outpipe.addOption('-vf', 'movie=' + watermarkPath270 + ' [watermark]; [in] [watermark] overlay=0:0 [out]');
            } else if (metadata.streams[0] && metadata.streams[0].tags.rotate == 270) {
              outpipe = outpipe.addOption('-vf', 'movie=' + watermarkPath180 + ' [watermark]; [in] [watermark] overlay=0:(main_h-overlay_h) [out]');
            } else {
              outpipe = outpipe.addOption('-vf', 'movie=' + watermarkPath + ' [watermark]; [in] [watermark] overlay=(main_w-overlay_w):(main_h-overlay_h) [out]')
            }

            outpipe.format('mp4').outputOptions('-movflags frag_keyframe+empty_moov').pipe().pipe(crypto.encryptor()).pipe(vid_output_stream);

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
