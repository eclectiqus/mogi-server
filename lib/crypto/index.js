/**
 * Created by martelli on 9/28/15.
 */
var crypto = require('crypto'),
  readline = require('readline'),
  config = require('../config'),
  counter = 0,
  conjunto = '',
  partitions = config.crypto.partitions;

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var bootstrap = function(plainkey, callback) {
  var key = crypto.pbkdf2Sync(plainkey, config.crypto.salt, 8192, 256, 'sha256');

  module.exports.decryptor = function() {
    return crypto.createDecipher('aes-256-cbc', key);
  }
  module.exports.encryptor = function() {
    return crypto.createCipher('aes-256-cbc', key);
  }

  //simple decoding test, to avoid entering a wrong master key:
  try {
    var test = config.crypto.challenge;
    var encryptdata = new Buffer(test, 'base64').toString('binary');
    var dec = module.exports.decryptor()
    var msg = dec.update(encryptdata, 'binary', 'utf8');
    msg += dec.final('utf-8');
    if (config.crypto.key)
      console.log(msg);
  } catch(ex) {
    throw new Error('Invalid master key');
  }
  callback.call();
}

var init = function(cb) {

  if (config.crypto.key) {
    counter = partitions+1;
    conjunto = config.crypto.key;
  }

  counter += 1;
  if (counter > partitions) {
    rl.close();
    bootstrap(conjunto, cb);
  } else {
    rl.question("Key "+counter+":", function(k) {
      conjunto += k;
      init(cb);
    });
  }
};

module.exports.crypto_init = init;
