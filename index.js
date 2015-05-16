/*jslint node: true */
'use strict';

var FileInfo = require('./lib/fileinfo.js');
var configs = require('./lib/configs.js');
var formidable = require('formidable');
var fs = require('fs');
var path = require('path');

module.exports = uploadService;

function uploadService(opts) {
    var options = configs.apply(opts);
    var transporter = options.storage.type === 'local' ? require('./lib/transport/local.js') : require('./lib/transport/aws.js');

    transporter = transporter(options);

    var fileUploader = {};

    fileUploader.config = options;

    function setNoCacheHeaders(res) {
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Content-Disposition', 'inline; filename="files.json"');
    }

    fileUploader.get = function(req, res, callback) {
        this.config.host = req.headers.host;
        setNoCacheHeaders(res);
        transporter.get(callback);
    };

    fileUploader.post = function(req, res, callback) {
        setNoCacheHeaders(res);
        var form = new formidable.IncomingForm();
        var tmpFiles = [];
        var files = [];
        var map = {};
        var fields = {};
        var redirect;

        this.config.host = req.headers.host;

        var configs = this.config;

        req.body = req.body || {};

        function finish(error, fileInfo) {

            if (error) return callback(error, {
                files: files
            }, redirect);

            if (!fileInfo) return callback(null, {
                files: files
            }, redirect);

            var allFilesProccessed = true;

            files.forEach(function(file, idx) {
                allFilesProccessed = allFilesProccessed && file.proccessed;
            });

            if (allFilesProccessed) {
                callback(null, {
                    files: files
                }, redirect);
            }
        }

        form.uploadDir = configs.tmpDir;

        form.on('fileBegin', function(name, file) {
            tmpFiles.push(file.path);
            // fix #41
            configs.saveFile = true;
            var fileInfo = new FileInfo(file, configs, fields);
            map[fileInfo.key] = fileInfo;
            files.push(fileInfo);
        }).on('field', function(name, value) {
            fields[name] = value;
            if (name === 'redirect') {
                redirect = value;
            }
        }).on('file', function(name, file) {
            var fileInfo = map[FileInfo.getFileKey(file.path)];
            fileInfo.update(file);
            if (!fileInfo.validate()) {
                finish(fileInfo.error);
                fs.unlink(file.path);
                return;
            }

            transporter.post(fileInfo, file, finish);

        }).on('aborted', function() {
            finish('aborted');
            tmpFiles.forEach(function(file) {
                fs.unlink(file);
            });
        }).on('error', function(e) {
            console.log('form.error', e);
            finish(e);
        }).on('progress', function(bytesReceived) {
            if (bytesReceived > configs.maxPostSize) {
                req.connection.destroy();
            }
        }).on('end', function() {
            //if (configs.storage.type == 'local') {
            //    finish();
            //}
        }).parse(req);
    };

    fileUploader.delete = function(req, res, callback) {
        transporter.delete(req, res, callback);
    };

    return fileUploader;
}
