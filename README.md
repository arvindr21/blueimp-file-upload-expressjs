# Blueimp file upload for Express js

[![Build Status](https://travis-ci.org/arvindr21/blueimp-file-upload-expressjs.svg?branch=master)](https://travis-ci.org/arvindr21/blueimp-file-upload-expressjs) [![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/arvindr21/blueimp-file-upload-expressjs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![NPM](https://nodei.co/npm/blueimp-file-upload-expressjs.png?downloads=true)](https://nodei.co/npm/blueimp-file-upload-expressjs/)

A simple express module for integrating the *[jQuery File Upload](http://blueimp.github.io/jQuery-File-Upload/)* frontend plugin.

[Fullstack Demo](http://expressjs-fileupload.cloudno.de/) | [Tutorial on my blog](http://thejackalofjavascript.com/uploading-files-made-fun)

> v 0.4.0 Released!

## Contents

* [Main features in v0.4.0](#main-features-in-v040)
* [Notices on upgrading v0.3.x to v0.4.0](#notices-on-upgrading-v03x-to-v040)
* [History](#history)
* [Installation](#installation)
* [Configuration](#configuration)
* [Usage with options](#usage-with-options)
* [SSL Support](#ssl-support)
* [Multiple thumbnails](#multiple-thumbnails)
* [Get Form Fields along with Upload](#get-form-fields-along-with-upload)
* [Tests](#tests)
* [Contributions](#contributions)


### Main features in v0.4.0

1. Upgrade lwip to v0.0.6
  > It means that we can upload and proccess GIF images now.

2. More NodeJs friendly callback API

  > Using function(err,data) instead of function(data,err)

### Notices on upgrading v0.3.x to v0.4.0

In order to make v0.4.0 to work properly, we need to change the uploader instance's callback function correspondingly as mentioned above.

From v0.3.x style,

```
uploader.get(req, res, function (obj) {
    res.send(JSON.stringify(obj)); 
});
```

To v0.4.0 style,

```
uploader.get(req, res, function (err,obj) {
    if(!err){
        res.send(JSON.stringify(obj));
    }
});

```

Similar rule that applies to the callback functions of `uploader.post` and `uploader.delete`. 

## History
The code was forked from a sample backend code from the [plugin's repo](https://github.com/blueimp/jQuery-File-Upload/tree/master/server/node). Adaptations were made to show how to use this plugin with the popular *[Express](http://expressjs.com/)* *Node.js* framework.

Although this code was initially meant for educational purposes, enhancements were made. Users can additionally:

* upgrade lwip to version 0.0.6 to support gif images (New at v0.4.0)
* choose the destination filesystem, local or cloud-based *Amazon S3*,
* create thumbnail without heavy external dependencies using [lwip](https://www.npmjs.com/package/lwip),
* setup server-side rules by [configuration](#Configuration),
* modify the code against a [test harness](#Tests). 

## Installation

Setup an *Express* project and install the package.

```js
$ npm install blueimp-file-upload-expressjs
```

Beginners can follow the [tutorial](http://thejackalofjavascript.com/uploading-files-made-fun) for detailed instructions.


## Configuration
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
### Usage with options 
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
      uploader.get(req, res, function (err,obj) {
            if(!err){
                res.send(JSON.stringify(obj));
            }
      });
      
    });

    router.post('/upload', function(req, res) {
      uploader.post(req, res, function (error,obj, redirect) {
          if(!error)
          {
            res.send(JSON.stringify(obj)); 
          }
      });
      
    });
    
    // the path SHOULD match options.uploadUrl
    router.delete('/uploaded/files/:name', function(req, res) {
      uploader.delete(req, res, function (err,obj) {
            res.Json({error:err}); 
      });
      
    });
    return router;
}
```
### SSL Support

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
    uploader.get(req, res, function (err,obj) {
    if(!err)
        res.send(JSON.stringify(obj)); 
})
    .post('/upload', // ...
    .delete('/uploaded/files/:name', // ...

// create the HTTPS server
var app_key = fs.readFileSync('key.pem');
var app_cert = fs.readFileSync('cert.pem');

https.createServer({key: app_key, cert: app_cert}, app).listen(443);

```

### Multiple thumbnails

To generate multiple thumbnails while uploading

```js
var options = {
  tmpDir: __dirname + '/../public/uploaded/tmp',
  uploadDir: __dirname + '/../public/uploaded/files',
  uploadUrl: '/uploaded/files/',
  copyImgAsThumb: true, // required
  imageVersions: {
    maxWidth: 200,
    maxHeight: 200
  },
  storage: {
    type: 'local'
  }
};
```
`copyImgAsThumb` needs to be set to true. `imageVersions`, `maxWidth` and `maxHeight` will by default create a `thumbnail` folder and place the specified width/height thumbnail in it.
 
Optionally, you can omit the `maxHeight`. In this case, it will be resize proportionally to the specified width. 

```js
imageVersions: {
    maxWidth: 200
  },
```

also

```js
imageVersions: {
    maxWidth: 200,
    maxHeight : 'auto'
  },
```
PS : `auto` value works only with height.

You can also specify multiple thumbnail generations like 

```js
var options = {
  tmpDir: __dirname + '/../public/uploaded/tmp',
  uploadDir: __dirname + '/../public/uploaded/files',
  uploadUrl: '/uploaded/files/',
  copyImgAsThumb: true,
  imageVersions: {
    maxWidth: 200,
    maxHeight: 'auto',
    "large" : {
        width : 600,
        height : 600
    },
    "medium" : {
        width : 300,
        height : 300
    },
    "small" : {
        width : 150,
        height : 150
    }
  },
  storage: {
    type: 'local'
  }
};
```

## Get Form Fields along with Upload
> Form fields will come as a part of a JSON object of fileInfo(like title/description). If not specified then will return empty object. [[PR42](https://github.com/arvindr21/blueimp-file-upload-expressjs/pull/42)]

Refer to : [How to submit additional form data](https://github.com/blueimp/jQuery-File-Upload/wiki/How-to-submit-additional-form-data) to send additional form data from the client. 

## Tests

Unit tests can be run with *Jasmine* using `npm test` or this command:
```js
$ jasmine-node specs/
```

Manual end to end tests can be done with [this full project](https://github.com/arvindr21/expressjs-fileupload). Change the `require()` path of [`uploadManager.js`](https://github.com/arvindr21/expressjs-fileupload/blob/master/routes/uploadManager.js#L29) to link it this cloned repository.

## Contributions

Changes and improvements are welcome! Feel free to fork and open a pull request.

### To Do
* Make [Configuration](#configuration) documentation clearer and shorter,
* Refactor code to build tests and provide generic transports as in `winston`, 
* Write end to end tests with [WebdriverIO](http://webdriver.io/),
* Provide a basic image processing pipeline (resizing, croping, filter effects),
* Fix AWS thubnail issue,
* Provide access to other cloud-based services like *Microsoft Azure*.

### Done

* ~~Fix Thumbnail creation when uploading images with a more 'feasible' approach~~,
* ~~Amazon S3 integration~~,
* ~~SSL Support~~.

***
## License

*blueimp-file-upload-expressjs* is licensed under the [MIT licence](http://opensource.org/licenses/MIT).

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
