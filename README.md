# Blueimp file upload for Express js

[![NPM](https://nodei.co/npm/blueimp-file-upload-expressjs.png?downloads=true)](https://nodei.co/npm/blueimp-file-upload-expressjs/)

[![Build Status](https://travis-ci.org/arvindr21/blueimp-file-upload-expressjs.svg?branch=master)](https://travis-ci.org/arvindr21/blueimp-file-upload-expressjs)

* A simple express module for integrating jQuery File Upload.
* The code is borrowed from [here](https://github.com/blueimp/jQuery-File-Upload/tree/master/server/node) and made compatible with Expressjs 
* [Demo](http://expressjs-fileupload.cloudno.de/)
* [Tutorial](http://thejackalofjavascript.com/uploading-files-made-fun)


## Features
* Upload to server
* Upload to AWS
* Client available [here](http://blueimp.github.io/jQuery-File-Upload/)

## Installation
```js
    $ npm install blueimp-file-upload-expressjs
```

## Options
```js
options = {
    tmpDir: __dirname + '/tmp', // tmp dir to upload files to
    uploadDir: __dirname + '/public/files', // actual location of the file
    uploadUrl: '/files/', // end point for delete route 
    maxPostSize: 11000000000, // 11 GB
    minFileSize: 1,
    maxFileSize: 10000000000, // 10 GB
    acceptFileTypes: /.+/i,
    inlineFileTypes: /\.(gif|jpe?g|png)/i,
    imageTypes:  /\.(gif|jpe?g|png)/i,
    copyImgAsThumb : true, // required
    imageVersions :{
        maxWidth : 200,
        maxHeight : 200
    },
    accessControl: {
        allowOrigin: '*',
        allowMethods: 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
        allowHeaders: 'Content-Type, Content-Range, Content-Disposition'
    },
    storage : {
        type : 'local', // local or aws
        aws : {
            accessKeyId :  'xxxxxxxxxxxxxxxxx', // required if aws
            secretAccessKey : 'xxxxxxxxxxxxxxxxxxxxxxx', // required if aws
            region : 'us-west-2', //make sure you know the region, else leave this option out
            bucketName : 'xxxxxxxxx' // required if aws
        }
    }
};

```
## Usage with options 
(*refer tutorial*)
```js
// config the uploader
var options = {
    tmpDir:  __dirname + '/../public/uploaded/tmp',
    uploadDir: __dirname + '/../public/uploaded/files',
    uploadUrl:  '/uploaded/files/',
    maxPostSize: 11000000000, // 11 GB
    minFileSize:  1,
    maxFileSize:  10000000000, // 10 GB
    acceptFileTypes:  /.+/i,
    // Files not matched by this regular expression force a download dialog,
    // to prevent executing any scripts in the context of the service domain:
    inlineFileTypes:  /\.(gif|jpe?g|png)/i,
    imageTypes:  /\.(gif|jpe?g|png)/i,
    copyImgAsThumb : true, // required
    imageVersions :{
        maxWidth : 200,
        maxHeight : 200
    },
    accessControl: {
        allowOrigin: '*',
        allowMethods: 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
        allowHeaders: 'Content-Type, Content-Range, Content-Disposition'
    },
    storage : {
        type : 'aws',
        aws : {
            accessKeyId :  'xxxxxxxxxxxxxxxxx',
            secretAccessKey : 'xxxxxxxxxxxxxxxxx',
            region : 'us-east-1',//make sure you know the region, else leave this option out
            bucketName : 'xxxxxxxxxxxxxxxxx'
        }
    }
};

// init the uploader
var uploader = require('blueimp-file-upload-expressjs')(options);


module.exports = function (router) {
    router.get('/upload', function(req, res) {
      uploader.get(req, res, function (obj) {
            res.send(JSON.stringify(obj)); 
      });
      
    });

    router.post('/upload', function(req, res) {
      uploader.post(req, res, function (obj) {
            res.send(JSON.stringify(obj)); 
      });
      
    });
    
    // the path SHOULD match options.uploadUrl
    router.delete('/uploaded/files/:name', function(req, res) {
      uploader.delete(req, res, function (obj) {
            res.send(JSON.stringify(obj)); 
      });
      
    });
    return router;
}
```
## SSL Support

Set the `useSSL` option to `true` to use the package with an [HTTPS server](http://expressjs.com/4x/api.html#app.listen).
```js
var express = require('express')
var fs = require('fs')
var https = require('https');

var app = express()

// config the uploader
var options = {
    ...
    useSSL: true
    ...
};

// init the uploader
var uploader = require('blueimp-file-upload-expressjs')(options);

app.get('/upload', function(req, res) {
    uploader.get(req, res, function (obj) {
    res.send(JSON.stringify(obj)); 
})
    .post('/upload', // ...
    .delete('/uploaded/files/:name', // ...

// create the HTTPS server
var app_key = fs.readFileSync('key.pem');
var app_cert = fs.readFileSync('cert.pem');

https.createServer({key: app_key, cert: app_cert}, app).listen(443);

```

## Todo

* Write Complete Tests
* ~~Fix Thumbnail creation when uploading images with a more 'feasible' appraoch~~
* Add reizing, croping and other filter effects
* ~~Amazon S3 Intergartion~~
* Azure Integration
* ~~SSL SUpport~~

***
## License

### MIT
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
