'use strict';

var fs = require('fs');
var path = require('path');

var mkdirp = require('mkdirp');

// Since Node 0.8, .existsSync() moved from path to fs: 
var _existsSync = fs.existsSync || path.existsSync;

module.exports = FileInfo;

module.exports.checkFolder = checkExists;

function FileInfo(file, opts) {
  this.name = file.name;
  this.size = file.size;
  this.type = file.type;
  this.modified = file.lastMod;
  this.deleteType = 'DELETE';
  this.options = opts;
}

FileInfo.prototype.safeName = function() {
  var nameCountRegexp = /(?:(?: \(([\d]+)\))?(\.[^.]+))?$/;

  function nameCountFunc(s, index, ext) {
    return ' (' + ((parseInt(index, 10) || 0) + 1) + ')' + (ext || '');
  }

  // Prevent directory traversal and creating hidden system files:
  this.name = path.basename(this.name).replace(/^\.+/, '');
  // Prevent overwriting existing files:
  while (_existsSync(this.options.uploadDir + '/' + this.name)) {
    this.name = this.name.replace(nameCountRegexp, nameCountFunc);
  }
};

FileInfo.prototype.initUrls = function(req, sss) {
  if (!this.error) {
    var that = this;
    if (!sss) {
      var baseUrl = (that.options.useSSL ? 'https:' : 'http:') +
        '//' + req.headers.host + that.options.uploadUrl;
      that.url = baseUrl + encodeURIComponent(that.name);
      that.deleteUrl = baseUrl + encodeURIComponent(that.name);
      Object.keys(that.options.imageVersions).forEach(function(version) {
        if (_existsSync(
            that.options.uploadDir + '/' + version + '/' + that.name
          )) {
          that[version + 'Url'] = baseUrl + version + '/' +
            encodeURIComponent(that.name);
        }
      });
    } else {
      that.url = sss.url;
      that.deleteUrl = that.options.uploadUrl + sss.url.split('/')[sss.url.split('/').length - 1].split('?')[0];
      if (that.options.imageTypes.test(sss.url)) {
        Object.keys(that.options.imageVersions).forEach(function(version) {
          that[version + 'Url'] = sss.url;
        });
      }
    }
  }
};

FileInfo.prototype.validate = function() {
  if (this.options.minFileSize && this.options.minFileSize > this.size) {
    this.error = 'File is too small';
  } else if (this.options.maxFileSize && this.options.maxFileSize < this.size) {
    this.error = 'File is too big';
  } else if (!this.options.acceptFileTypes.test(this.name)) {
    this.error = 'Filetype not allowed';
  }
  return !this.error;
};

// check if folder exists, otherwise create it
function checkExists(dir) {
  fs.exists(dir, function(exists) {
    if (!exists) {
      mkdirp(dir, function(err) {
        if (err) console.error(err);
        else console.log('The uploads folder was not present, we have created it for you [' + dir + ']');
      });
      //throw new Error(dir + ' does not exists. Please create the folder');
    }
  });
}
