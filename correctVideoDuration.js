var
  db = require('./lib/db'),
  storage = require('./lib/videos/storage'),
  ffmpeg = require('fluent-ffmpeg');

//search for all videos which have 0 or 1 as duration.
db.video.findAll({where: {$or: [{duration: 0}, {duration: 1}]}}).then(function(videos){
  //find the mp4 files
  for (var i = 0 ; i < videos.length ; i++) {
    console.log(".");
    var video = videos[i];
    //check if the file exists
    if (!storage.exists(video)) {
      //if it doesn't, mark the video as deleted
    } else {
      //if it does, check the metadata.
      storage.getTotaDuration(video, function(duration){
        console.log("new duration for video: "+duration+" - "+this.id);
        //include the metadata in the
        this.duration = Math.ceil(duration);
        this.save();
      });
    }
  }

});
