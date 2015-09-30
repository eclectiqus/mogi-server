var crypto = require('crypto'),
    fs = require('node-fs'),
    glob = require('glob'),
    db = require('./lib/db');

var conjunto = '5wyv4fnn2czydg74vgywrm5hbg8s6t';
var key = crypto.pbkdf2Sync(conjunto, '7892393862398634875689', 8192, 256, 'sha256');

var dec = function() {
  return crypto.createDecipher('aes-256-cbc', key);
}

var enc = function() {
  return crypto.createCipher('aes-256-cbc', key);
}

glob(__dirname+"/videos/*/*.mp4", {}, function (er, files) {

  if (er)
    console.log(er);

  files.forEach(function(outf) {

    var videosize = fs.statSync(outf).size;
    var out = fs.createWriteStream(outf+'.enc');

    var path_split = outf.replace('.mp4', '').split('/');
    var v_id = path_split[path_split.length-1];

    out.on('finish', function() {
      db.video.update({filesize: videosize, isValid: true}, {where: {id: v_id}}).then(function() {
        console.log("File '"+outf+"' done.");
      });
    });

    var ec = enc()
    ec.on('error', function(err) {
      console.log('---'+err);
    });
    ec.on('finish', function(err) {
      console.log(outf+' encrypted.');
    });
    fs.createReadStream(outf).pipe(ec).pipe(out);
  });
});
