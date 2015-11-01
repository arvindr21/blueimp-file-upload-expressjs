/*jslint node: true */
'use strict';

var fs              = require('fs');
var AWS             = require('aws-sdk');
var FileInfo        = require('../fileinfo.js');

/**
 * AWS transport
 *
 * @param {Object} opts
 * @param {Object} opts.storage
 * @param {Object} opts.storage.aws
 * @param {string} opts.storage.aws.accessKeyId
 * @param {string} opts.storage.aws.secretAccessKey
 * @param {string} opts.storage.aws.region
 * @param {string} opts.storage.aws.bucketName
 * @param {string} opts.storage.aws.acl
 * @param {string} [opts.storage.aws.cacheControl] - Sets the S3 CacheControl
 *   param.
 * @param {Number} [opts.storage.aws.expiresInMilliseconds] - Sets the S3
 *   Expires param with expiresInMilliseconds from the current time
 * @param {boolean} [opts.storage.aws.getSignedUrl=true] - If set to true, the
 *   upload callback will pass a signed URL of the file, that will expire in
 *   signedUrlExpiresSeconds if set (default 900s = 15m). If set to false, the
 *   callback will pass the actual URL. More info about the signed URL here:
 *   http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getSignedUrl-property
 * @param {boolean} [opts.storage.aws.signedUrlExpiresSeconds=900] - For use
 *   with getSignedUrl=true.
 * @param {string} [opts.storage.aws.path] - Path on bucket to store uploads
 *
 * @example
 * awsTransport({
 *   storage: {
 *     type: 'aws',
 *     aws: {
 *       accessKeyId: '...',
 *       secretAccessKey: '...',
 *       region: 'us-west-2',
 *       bucketName: '...',
 *       acl: 'public-read',
 *       cacheControl: 'max-age=630720000, public',
 *       expiresInMilliseconds: 63072000000,
 *       getSignedUrl: false,
 *       path: 'uploads/'
 *     }
 *   }
 * });
 */
module.exports = function (opts){

    var configs = opts.storage.aws;

    // init aws
    AWS.config.update({
        accessKeyId: configs.accessKeyId,
        secretAccessKey: configs.secretAccessKey
    });
    if (configs.region) AWS.config.region = configs.region;

    var api = {
        s3:new AWS.S3({computeChecksums:true}),
        configs:configs,
        options:opts,
        upload:function(fileName,filePath,callback){
            uploadFile(this.s3,fileName,filePath,this.configs,callback);    
        },
        /**
         * get files
         */
        get:function(callback){
            var params = {
                Bucket: api.configs.bucketName // required
                //Delimiter: 'STRING_VALUE',
                //EncodingType: 'url',
                //Marker: 'STRING_VALUE',
                //MaxKeys: 0,
                //Prefix: 'STRING_VALUE',
            };
            var files = [];
            var options = this.options;
            api.s3.listObjects(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack); 
                    return callback(err);
                }
                data.Contents.forEach(function(o) {
                    var sss = {
                        url: (options.useSSL ? 'https:' : 'http:') + '//s3.amazonaws.com/' + configs.bucketName + '/' + o.Key
                    };
                    var fileInfo = new FileInfo({
                        name: options.UUIDRegex.test(o.Key) ? o.Key.split('__')[1] : o.Key,
                        size: o.Size,
                        awsFile:sss
                    }, options);
                    fileInfo.initUrls();
                    files.push(fileInfo);

                });
                callback(null,{files: files});
            });
        },
        post:function(fileInfo,file,finish){
            
            this.upload(fileInfo.name, file.path, function(error,awsFile) {
                if(!error){
                    fileInfo.awsFile = awsFile;
                    fileInfo.proccessed = true;
                    fileInfo.initUrls();
                }
                finish(error,fileInfo);
            });
        },
        delete:function(req,res,callback){
            var options = api.options;
            var params = {
                Bucket: options.storage.aws.bucketName, // required
                Key: decodeURIComponent(req.url.split('/')[req.url.split('/').length - 1]) // required
            };
            console.log(params);
            this.s3.deleteObject(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack); 
                    return callback(err);
                }

                console.log(data); // successful response
                callback(null,data);
            });
    
        }
    };

    return api;
    
};

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
  var metaData = getContentTypeByFile(fileName);
  var remoteFilename = b() + '__' + fileName;
  var params = {
    ACL: opts.acl,
    Bucket: opts.bucketName,
    Key: (opts.path || '') + remoteFilename,
    Body: fileBuffer,
    ContentType: metaData
  };

  // consider setting params.CacheControl by default to 'max-age=630720000, public'
  if (typeof opts.cacheControl !== 'undefined') {
    params.CacheControl = opts.cacheControl;
  }

  // consider setting params.Expires by default to new Date(Date.now() + 63072000000)
  if (typeof opts.expiresInMilliseconds !== 'undefined') {
    params.Expires = new Date(Date.now() + opts.expiresInMilliseconds);
  }

  s3.putObject(params, function(error) {
    var url;

    if (typeof opts.getSignedUrl === 'undefined' || opts.getSignedUrl === true) {

        // getSignedUrl documentation
        // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getSignedUrl-property
        url = s3.getSignedUrl('getObject', {
          Bucket: opts.bucketName,
          Key: remoteFilename,
          Expires: opts.signedUrlExpires || 900
        });
    } else {
        url = s3.endpoint.href + opts.bucketName + '/' + opts.path + remoteFilename;
    }
    
    callback(error,{ url: url});
  });
}
