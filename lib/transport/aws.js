'use strict';

var fs = require('fs');
module.exports = uploadFile;

// AWS Random UUID
/* https://gist.github.com/jed/982883#file-index-js */
function b(a) {
  return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
}

function getContentTypeByFile(fileName) {
  var rc = 'application/octet-stream';
  var fn = fileName.toLowerCase();

  if (fn.indexOf('.html') >= 0) rc = 'text/html';
  else if (fn.indexOf('.css') >= 0) rc = 'text/css';
  else if (fn.indexOf('.json') >= 0) rc = 'application/json';
  else if (fn.indexOf('.js') >= 0) rc = 'application/x-javascript';
  else if (fn.indexOf('.png') >= 0) rc = 'image/png';
  else if (fn.indexOf('.jpg') >= 0) rc = 'image/jpg';

  return rc;
}

function uploadFile(s3, fileName, filePath, opts, callback) {
  var fileBuffer = fs.readFileSync(filePath);
  var metaData = getContentTypeByFile(filePath);
  var remoteFilename = b() + '__' + fileName;

  s3.putObject({
    ACL: opts.ACL,
    Bucket: opts.Bucket,
    Key: remoteFilename,
    Body: fileBuffer,
    ContentType: metaData
  }, function(error) {
    var params = {
      Bucket: opts.Bucket,
      Key: remoteFilename
    };

    var url = s3.getSignedUrl('getObject', params);
    
    callback({
      url: url
    }, error);
  });
}