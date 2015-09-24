var
  db = require('./lib/db'),
  storage = require('./lib/videos/storage');

//search for all videos which have 0 or 1 as duration.
console.log('will start looking for videos');
db.video.findAll({where: {$or: [{duration: 0}, {duration: 1}]}}).then(function(videos){
  //find the mp4 files
  i = videos.length-1;
  console.log(".");
  correct(videos, i);


});

function correct(videos, i){
  if (i == 0){
    console.log('finalized');
    return;
  }
  var video = videos[i];
  //check if the file exists
  if (!storage.exists(video)) {
    //if it doesn't, mark the video as deleted
    console.log("video does not exists");
    correct(videos, i-1);
  } else {
    //if it does, check the metadata.
    storage.getTotaDuration(video, function(duration){
      console.log("new duration for video: "+duration+" - "+this.id);
      //include the metadata in the
      if (Math.ceil(duration) == 0){
        this.isValid = false;
      } else {
        this.duration = Math.ceil(duration);
        this.isValid = true;
      }
      this.save();
      correct(videos, i-1);
    });
  }
}
