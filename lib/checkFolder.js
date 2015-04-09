var fs = require('fs');
var mkdirp  = require('mkdirp');
/**
 * check if folder exists, otherwise create it
 */
module.exports = function checkExists(dir) {
  fs.exists(dir, function(exists) {
    if (!exists) {
      mkdirp(dir, function(err) {
        if (err) console.error(err);
        else console.log('The uploads folder was not present, we have created it for you [' + dir + ']');
      });
      //throw new Error(dir + ' does not exists. Please create the folder');
    }
  });
};
