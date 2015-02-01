'use strict';

var FileInfo = require('./lib/fileinfo.js');
var checkExists = FileInfo.checkFolder;

// TODO - Refactor these 3 guys to aws.js Transport
var AWS = require('aws-sdk');
var uploadFileAWS = require('./lib/transport/aws.js');
var s3;

// TODO - Provide a locale filesystem Transport

var fs = require('fs');
var path = require('path');

module.exports = uploadService;

function applyConfig(opts) {
  var options = {
    tmpDir: opts.tmpDir || __dirname + '/tmp',
    uploadDir: opts.uploadDir || __dirname + '/public/files',
    uploadUrl: opts.uploadUrl || '/files/',
    maxPostSize: opts.maxPostSize || 11000000000, // 11 GB
    minFileSize: opts.minFileSize || 1,
    maxFileSize: opts.maxFileSize || 10000000000, // 10 GB
    acceptFileTypes: opts.acceptFileTypes || /.+/i,
    copyImgAsThumb: opts.copyImgAsThumb && true,
    useSSL: opts.useSSL || false,
    UUIDRegex: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
    // Files not matched by this regular expression force a download dialog,
    // to prevent executing any scripts in the context of the service domain:
    inlineFileTypes: opts.inlineFileTypes || /\.(gif|jpe?g|png)/i,
    imageTypes: opts.imageTypes || /\.(gif|jpe?g|png)/i,
    imageVersions: {
      'thumbnail': {
        width: (opts.imageVersions && opts.imageVersions.maxWidth) ? opts.imageVersions.maxWidth : 99,
        height: (opts.imageVersions && opts.imageVersions.maxHeight) ? opts.imageVersions.maxHeight : 'auto'
      }
    },
    accessControl: {
      allowOrigin: (opts.accessControl && opts.accessControl.allowOrigin) ? opts.accessControl.allowOrigin : '*',
      allowMethods: (opts.accessControl && opts.accessControl.allowMethods) ? opts.accessControl.allowMethods : 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
      allowHeaders: (opts.accessControl && opts.accessControl.allowHeaders) ? opts.accessControl.allowHeaders : 'Content-Type, Content-Range, Content-Disposition'
    },
    storage: {
      type: (opts.storage && opts.storage.type) ? opts.storage.type : 'local',
      aws: {
        accessKeyId: (opts.storage && opts.storage.aws && opts.storage.aws.accessKeyId) ? opts.storage.aws.accessKeyId : null,
        secretAccessKey: (opts.storage && opts.storage.aws && opts.storage.aws.secretAccessKey) ? opts.storage.aws.secretAccessKey : null,
        region: (opts.storage && opts.storage.aws && opts.storage.aws.region) ? opts.storage.aws.region : null,
        bucketName: (opts.storage && opts.storage.aws && opts.storage.aws.bucketName) ? opts.storage.aws.bucketName : null,
        acl: (opts.storage && opts.storage.aws && opts.storage.aws.acl) ? opts.storage.aws.acl : 'public-read'
      }
    }
  };

  if (opts.imageVersions) {
    Object.keys(opts.imageVersions).forEach(function(version) {
      if (version != 'maxHeight' && version != 'maxWidth') {
        options.imageVersions[version] = opts.imageVersions[version];
      }
    });
  }

  if (options.storage.type === 'local') {
    checkExists(options.tmpDir);
    checkExists(options.uploadDir);
    if (options.copyImgAsThumb) {
      Object.keys(options.imageVersions).forEach(function(version) {
        checkExists(options.uploadDir + '/' + version);
      });
    }
  } else if (opts.storage.type === 'aws') {
    if (!opts.storage.aws.accessKeyId || !opts.storage.aws.secretAccessKey || !opts.storage.aws.bucketName) {
      throw new Error('Please enter valid AWS S3 details');
    } else {
      // init aws
      AWS.config.update({
        accessKeyId: options.storage.aws.accessKeyId,
        secretAccessKey: options.storage.aws.secretAccessKey
      });
      if (options.storage.aws.region) AWS.config.region = options.storage.aws.region;
      s3 = new AWS.S3({
        computeChecksums: true
      });
    }
  }

  return options;
}

function uploadService(opts) {
  var lwip = require('lwip');
  var formidable = require('formidable');

  var fileUploader = {};

  fileUploader.config = applyConfig(opts);
  var options = fileUploader.config;

  function setNoCacheHeaders(res) {
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Content-Disposition', 'inline; filename="files.json"');
  }

  fileUploader.get = function(req, res, callback) {
    setNoCacheHeaders(res);
    var files = [];
    if (options.storage.type == 'local') {
      fs.readdir(options.uploadDir, function(err, list) {
        list.forEach(function(name) {
          var stats = fs.statSync(options.uploadDir + '/' + name);
          if (stats.isFile() && name[0] !== '.') {
            var fileInfo = new FileInfo({
              name: name,
              size: stats.size,
              lastMod: stats.mtime
            }, options);
            fileInfo.initUrls(req);
            files.push(fileInfo);
          }
        });
        callback({
          files: files
        });
      });
    } else if (options.storage.type == 'aws') {
      var params = {
        Bucket: options.storage.aws.bucketName, // required
        //Delimiter: 'STRING_VALUE',
        //EncodingType: 'url',
        //Marker: 'STRING_VALUE',
        //MaxKeys: 0,
        //Prefix: 'STRING_VALUE',
      };
      s3.listObjects(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        //else     console.log(data);           // successful response

        data.Contents.forEach(function(o) {
          var fileInfo = new FileInfo({
            name: options.UUIDRegex.test(o.Key) ? o.Key.split('__')[1] : o.Key,
            size: o.Size
          }, options);
          var sss = {
            url: (options.useSSL ? 'https:' : 'http:') + '//s3.amazonaws.com/' + options.storage.aws.bucketName + '/' + o.Key
          };
          fileInfo.initUrls(req, sss);
          files.push(fileInfo);

        });
        callback({
          files: files
        });
      });
    }
  };

  fileUploader.post = function(req, res, callback) {
    setNoCacheHeaders(res);
    var form = new formidable.IncomingForm();
    var tmpFiles = [];
    var files = [];
    var map = {};
    var counter = 1;
    var redirect;
   
    req.body = req.body || {};

    function finish(sss, error) {
      counter -= 1;
      if (!counter) {
        files.forEach(function(fileInfo) {
          fileInfo.initUrls(req, sss);
        });
        callback({
          files: files
        }, redirect, error);
      }
    }

    form.uploadDir = options.tmpDir;

    form.on('fileBegin', function(name, file) {
      tmpFiles.push(file.path);
      var fileInfo = new FileInfo(file, options, req, true);
      fileInfo.safeName();
      map[path.basename(file.path)] = fileInfo;
      files.push(fileInfo);
    }).on('field', function(name, value) {
      if (name === 'redirect') {
        redirect = value;
      }
      // In order to make lusca's csrf function work, we need to attach the form's text field data to req.body
      // (referencing to https://github.com/krakenjs/lusca/blob/master/lib/csrf.js line 42)
      // 
      if (req.body.hasOwnProperty(name)) {
        if (Array.isArray(req.body[name])) {
          req.body[name].push(val);
        } else {
          req.body[name] = [req.body[name], val];
        }
      } else {
        req.body[fieldname] = val;
      }
    }).on('file', function(name, file) {
      var fileInfo = map[path.basename(file.path)];
      fileInfo.size = file.size;
      if (!fileInfo.validate()) {
        // TODO - Missing callback
        fs.unlink(file.path);
        return;
      }
      // part ways here
      if (options.storage.type == 'local') {
        fs.renameSync(file.path, options.uploadDir + '/' + fileInfo.name);
        if (options.copyImgAsThumb && options.imageTypes.test(fileInfo.name)) {
          Object.keys(options.imageVersions).forEach(function(version) {
            counter += 1;
            var opts = options.imageVersions[version];
            if (options.copyImgAsThumb) {
              lwip.open(options.uploadDir + '/' + fileInfo.name, function(err, image) {
                if (opts.height == 'auto') {
                  image.batch()
                    .resize(opts.width)
                    .writeFile(options.uploadDir + '/' + version + '/' + fileInfo.name, function(err) {
                      if (err) throw err;
                      finish();
                    });
                } else {
                  image.batch()
                    .resize(opts.width, opts.height)
                    .writeFile(options.uploadDir + '/' + version + '/' + fileInfo.name, function(err) {
                      if (err) throw err;
                      finish();
                    });
                }
              });
            }
          });
        }
      } else if (options.storage.type == 'aws') {
        var awsOpts = {
          ACL: options.storage.aws.acl,
          Bucket: options.storage.aws.bucketName
        };

        uploadFileAWS(s3, fileInfo.name, file.path, awsOpts, function(sss, error) {
          finish(sss, error);
        });
      }
    }).on('aborted', function() {
      tmpFiles.forEach(function(file) {
        // TODO - Missing callback
        fs.unlink(file);
      });
    }).on('error', function(e) {
      console.log(e);
    }).on('progress', function(bytesReceived) {
      if (bytesReceived > options.maxPostSize) {
        req.connection.destroy();
      }
    }).on('end', function() {
      if (options.storage.type == 'local') {
        finish();
      }
      // finish();
    }).parse(req);
  };

  fileUploader.delete = function(req, res, callback) {
    var fileName;
    if (options.storage.type == 'local') {
      if (req.url.slice(0, options.uploadUrl.length) === options.uploadUrl) {
        fileName = path.basename(decodeURIComponent(req.url));
        if (fileName[0] !== '.') {
          fs.unlink(options.uploadDir + '/' + fileName, function(ex) {
            Object.keys(options.imageVersions).forEach(function(version) {
              // TODO - Missing callback
              fs.unlink(options.uploadDir + '/' + version + '/' + fileName);
            });
            callback({
              success: !ex
            });
          });
          return;
        }
      }
      callback({
        success: false
      });
    } else if (options.storage.type == 'aws') {
      var params = {
        Bucket: options.storage.aws.bucketName, // required
        Key: decodeURIComponent(req.url.split('/')[req.url.split('/').length - 1]) // required
      };
      console.log(params);
      s3.deleteObject(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data); // successful response
        callback({
          success: data
        });
      });
    }
  };

  return fileUploader;
}
