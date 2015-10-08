var crypto = require('./lib/crypto'),
  fs = require('node-fs'),
  glob = require('glob'),
  config = require('./lib/config'),
  db = require('./lib/db');

var run = function() {

  glob(__dirname+"/videos/*/*.{mp4,m4a}", {}, function (er, files) {

    if (er)
      console.log(er);

    files.forEach(function(outf) {

      var videosize = fs.statSync(outf).size;
      var out = fs.createWriteStream(outf+'.enc');

      var path_split = outf.replace('.mp4', '').split('/');
      var v_id = path_split[path_split.length-1];

      out.on('finish', function() {
        if (outf.indexOf('.mp4')>0) {
          db.video.update({filesize: videosize, isValid: true}, {where: {id: v_id}}).then(function () {
            console.log("File '" + outf + "' done.");
          });
        }
      });

      var ec = crypto.encryptor();
      ec.on('error', function(err) {
        console.log(err);
      });
      ec.on('finish', function(err) {
        console.log(outf+' encrypted.');
      });

      fs.createReadStream(outf).pipe(ec).pipe(out);
    });
  });
}

crypto.crypto_init(run);
