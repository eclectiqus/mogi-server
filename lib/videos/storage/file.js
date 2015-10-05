var path = require('path'),
    fs = require('node-fs'),
    FFmpeg = require('fluent-ffmpeg'),
    mv = require('mv');

var basePath = path.resolve(__dirname, '../../../videos') + '/';
var watermarkPath90 = path.resolve(__dirname, '../../../images') + '/watermark_90.png';
var watermarkPath = path.resolve(__dirname, '../../../images') + '/watermark.png';
var watermarkPath180 = path.resolve(__dirname, '../../../images') + '/watermark_180.png';
var watermarkPath270 = path.resolve(__dirname, '../../../images') + '/watermark_270.png';
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

      ffmpeg = ffmpeg.withNoAudio();
    //removing watermark for deploying
    // if (metadata.streams[0] && metadata.streams[0].tags.rotate == 90) {
    //  ffmpeg = ffmpeg.addOption('-vf', 'movie=' + watermarkPath90 + ' [watermark]; [in] [watermark] overlay=(main_w-overlay_w):0 [out]');
    //} else if (metadata.streams[0] && metadata.streams[0].tags.rotate == 180) {
    //  ffmpeg = ffmpeg.addOption('-vf', 'movie=' + watermarkPath270 + ' [watermark]; [in] [watermark] overlay=0:0 [out]');
    //} else if (metadata.streams[0] && metadata.streams[0].tags.rotate == 270) {
    //  ffmpeg = ffmpeg.addOption('-vf', 'movie=' + watermarkPath180 + ' [watermark]; [in] [watermark] overlay=0:(main_h-overlay_h) [out]');
    //} else {
    //  ffmpeg = ffmpeg.addOption('-vf', 'movie=' + watermarkPath + ' [watermark]; [in] [watermark] overlay=(main_w-overlay_w):(main_h-overlay_h) [out]')
    //}

    ffmpeg.on('error', function(err, stdout, stderr) {
          console.log("ffmpeg stdout:\n" + stdout);
          console.log("ffmpeg stderr:\n" + stderr);

          console.log('Cannot process video: ' + err.message);
          callback(err);
          return;
      }).on('end', function() {
          // The 'end' event is emitted when FFmpeg finishes
          // processing.

      }).saveToFile(finalVideoPath);
  });
  fs.mkdir(path.dirname(finalAudioPath), 0777, true, function(err) {
    if ( err ) return callback(err, null);
    var ffmpeg = new FFmpeg({ source: sourcePath });

    ffmpeg = ffmpeg.withNoVideo();
    ffmpeg.on('error', function(err, stdout, stderr) {
      console.log('Cannot process audio: ' + err.message);
      callback(err);
      return;
    }).on('end', function() {
      // The 'end' event is emitted when FFmpeg finishes
      // processing.
      console.log('Processing finished successfully');
    }).saveToFile(finalAudioPath);
    callback(null);
  });
};


exports.readVideoStream = function(video, callback, options) {
  callback(null, fs.createReadStream(basePath + video.videoPath(),options));
};

exports.getTotalSize = function(video){
  console.log(basePath + video.videoPath());
    return fs.statSync(basePath + video.videoPath()).size;
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
}

exports.exists = function(video){
    return(fs.existsSync(basePath + video.videoPath()));
}
