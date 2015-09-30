/**
 * Created by martelli on 9/28/15.
 */
var crypto = require('crypto');
var readline = require('readline');
var conjunto;

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var init = function(cb) {

  rl.question("Key 1:", function(k1) {
    rl.question("Key 2:", function(k2) {
      rl.question("Key 3:", function(k3) {

        conjunto = k1+k2+k3+'5wyv4fnn2czydg74vgywrm5hbg8s6t';
        rl.close();

        var key = crypto.pbkdf2Sync(conjunto, '7892393862398634875689', 8192, 256, 'sha256');



        module.exports.decryptor = function() {
          return crypto.createDecipher('aes-256-cbc', key);
        }
        module.exports.encryptor = function() {
          return crypto.createCipher('aes-256-cbc', key);
        }

        //simple decoding test, to avoid entering a wrong master key:
        try {
          var test = 'Elt/abz0ldFzGwDsQlKmWcZ8+wvEPdOPOIHPhwHtCy4=';
          var encryptdata = new Buffer(test, 'base64').toString('binary');
          var dec = module.exports.decryptor()
          var msg = dec.update(encryptdata, 'binary', 'utf8');
          msg += dec.final('utf-8');
          console.log(msg);
        } catch(ex) {
          throw new Error('Invalid master key');
        }
        cb.call();
      });
    });
  });

};

module.exports.crypto_init = init;
