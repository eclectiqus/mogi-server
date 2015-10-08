var path = require('path'),
  fs = require('node-fs'),
  FFmpeg = require('fluent-ffmpeg'),
  db = require('../../db'),
  crypto = require('../../crypto'),
  uuid = require('node-uuid'),
  StreamMeter = require('stream-meter');


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
  var path = basePath + video.encVideoPath();
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
      if (err)
        return callback.call(500, err);

      if (!metadata) {
        //por enquanto vamos abortar neste caso
        return callback.call(500, 'WARNING: could not read metadata');
      }

      if (metadata.format)
        duration = Math.ceil(metadata.format.duration);
      else
        duration = metadata.durationsec;

      var video = db.video.build({id: uuid.v4(), date: dateRecorded.toISOString(), duration: duration});
      video.setUser(user, {save: false});
      var enc_video_path = basePath + video.encVideoPath();
      var enc_audio_path = basePath + video.encAudioPath();

      fs.mkdir(path.dirname(enc_video_path), 0777, true, function(err) {
        if (err)
          return callback(500, err);

        var ffmpeg = new FFmpeg({source: rawVideoPath});
        var vid_output_stream = fs.createWriteStream(enc_video_path);

        var outpipe = ffmpeg.on('error', function (err, stdout, stderr) {
          return callback(500, err);
        });

        var finalize_ingestion = function () {
          fs.unlink(rawVideoPath, function() {
            video.filesize = meter.bytes;
            video.save().then(function(video) {
              return callback.call(201);
            }).catch(function(err) {
              return callback.call(500, err);
            });
          });
        }

        vid_output_stream.on('finish', function () {

          console.log('finish video');
          var enc_audio_path = basePath + video.encAudioPath();
          var audio_ffmpeg = new FFmpeg({source: rawVideoPath});
          var audio_output_stream = fs.createWriteStream(enc_audio_path);
          audio_ffmpeg = audio_ffmpeg.withNoVideo().addOption('-strict -2');

          //even if audio is not correctly produced, register video in database
          audio_ffmpeg.on('end', function() {
            console.log('audio done.')
            finalize_ingestion();
          }).on('error', function(err) {
            console.log(err);
            finalize_ingestion();
          });

          audio_ffmpeg.format('mp4').outputOptions('-movflags frag_keyframe+empty_moov').pipe().pipe(crypto.encryptor()).pipe(audio_output_stream);

        }).on('error', function (err) {
          return callback.call(500, err);
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

        meter = new StreamMeter();
        outpipe.format('mp4').outputOptions('-movflags frag_keyframe+empty_moov').pipe().pipe(meter).pipe(crypto.encryptor()).pipe(vid_output_stream);
      });
    });
  });
};
