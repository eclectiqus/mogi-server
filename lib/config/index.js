var lodash = require('lodash');

module.exports = lodash.extend(
    require(__dirname + '/../../config/common.json'),
    require(__dirname + '/../../config/' + process.env.NODE_ENV + '.json') || {});
