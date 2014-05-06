# Blueimp file upload for Express js

* A simple express module for integrating jQuery File Upload.
* The code is borrowed from [here](https://github.com/blueimp/jQuery-File-Upload/tree/master/server/node) and made compatible with Expressjs 
* [Demo](http://expressjs-fileupload.cloudno.de/)
* [Tutorial](http://thejackalofjavascript.com/uploading-files-made-fun)

[![Build Status](https://travis-ci.org/arvindr21/blueimp-file-upload-expressjs.svg?branch=master)](https://travis-ci.org/arvindr21/blueimp-file-upload-expressjs)

## Features
* Upload to server
* Upload to AWS
* Client already available [here](http://blueimp.github.io/jQuery-File-Upload/)

## Installation

    $ npm install blueimp-file-upload-expressjs



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
    imageVersions: {
        'thumbnail': {
            width: 80,
            height: 80
        }
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
    imageVersions: {
        width:  80,
        height: 80
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

As of now, I have not added the options for SSL support. If you need SSL support, fork this repo and in index.js, uncomment the SSL section.


## Todo

* Write Complete Tests
* Fix Thumbnail creation when uploading images with a more 'feasible' appraoch
* Add reizing, croping and other filter effects 
* ~~Amazon S3 Intergartion~~
* Azure Integration

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
