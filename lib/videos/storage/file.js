var path = require('path'),
    fs = require('node-fs'),
    FFmpeg = require('fluent-ffmpeg'),
    mv = require('mv');

var basePath = path.resolve(__dirname, '../../../videos') + '/';
exports.createVideoStream = function(sourcePath, video, metadata, callback) {
  var finalVideoPath = basePath + video.videoPath();
  var finalAudioPath = basePath + video.audioPath();
  fs.mkdir(path.dirname(finalVideoPath), 0777, true, function(err) {
      if ( err ) return callback(error, null);

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
    if ( err ) return callback(error, null);
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
