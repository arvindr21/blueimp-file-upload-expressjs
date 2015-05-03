/*jslint node: true */
var fs = require('fs');
var FileInfo = require('../fileinfo.js');
var lwip = require('lwip');
var path = require('path');
var async = require('async');

module.exports = function(opts) {

    var api = {
        options: opts,
        /**
         * get files
         */
        get: function(callback) {
            var files = [],
                options = this.options;
            // fix #41
            options.saveFile = false;
            fs.readdir(options.uploadDir, function(err, list) {
                list.forEach(function(name) {
                    var stats = fs.statSync(options.uploadDir + '/' + name);
                    if (stats.isFile() && name[0] !== '.') {
                        var fileInfo = new FileInfo({
                            name: name,
                            size: stats.size,
                            lastMod: stats.mtime
                        }, options);
                        fileInfo.initUrls();
                        files.push(fileInfo);
                    }
                });
                callback(null, {
                    files: files
                });
            });
        },
        proccessVersionFile: function(versionObj, cbk) {

            var options = api.options;
            var retVal = versionObj;

            lwip.open(options.uploadDir + '/' + versionObj.fileInfo.name, function(error, image) {

                if (error) return cbk(error, versionObj.version);

                //update pics width and height
                if (!retVal.fileInfo.width) {
                    retVal.fileInfo.width = image.width() || 50; //incase we don't get a valid width
                    retVal.fileInfo.height = image.height() || retVal.fileInfo.width;
                }

                var opts0 = options.imageVersions[versionObj.version];
                if (opts0.height == 'auto') {

                    retVal.width = opts0.width;
                    retVal.height = (opts0.width / retVal.fileInfo.width) * retVal.fileInfo.height;
                    image.batch().resize(opts0.width, retVal.height).writeFile(options.uploadDir + '/' + versionObj.version + '/' + versionObj.fileInfo.name, function(err) {
                        if (err) {
                            cbk(err, retVal);
                            return;
                        }
                        cbk(null, retVal);
                    });
                    return;
                }
                retVal.width = opts0.width;
                retVal.height = opts0.height;
                image.batch().resize(opts0.width, opts0.height).writeFile(options.uploadDir + '/' + versionObj.version + '/' + versionObj.fileInfo.name, function(err) {
                    if (err) {
                        return cbk(err, retVal);
                    }
                    cbk(null, retVal);
                });

            });
        },
        post: function(fileInfo, file, finish) {

            var me = this,
                options = this.options,
                versionFuncs = [];


            fs.renameSync(file.path, options.uploadDir + '/' + fileInfo.name);

            if ((!options.copyImgAsThumb) || (!options.imageTypes.test(fileInfo.name))) {
                fileInfo.initUrls();
                fileInfo.proccessed = true;
                return finish(null, fileInfo);
            }


            Object.keys(options.imageVersions).forEach(function(version) {

                versionFuncs.push({
                    version: version,
                    fileInfo: fileInfo
                });

            });


            async.map(versionFuncs, me.proccessVersionFile, function(err, results) {

                results.forEach(function(v, i) {
                    fileInfo.versions[v.version] = {
                        err: v.err,
                        width: v.width,
                        height: v.height
                    };
                });
                fileInfo.initUrls();
                fileInfo.proccessed = true;
                finish(err, fileInfo);

            });


        },
        delete: function(req, res, callback) {
            var options = this.options;
            var fileName = '';
            if (req.url.slice(0, options.uploadUrl.length) === options.uploadUrl) {
                fileName = path.basename(decodeURIComponent(req.url));
                if (fileName[0] !== '.') {
                    fs.unlink(options.uploadDir + '/' + fileName, function(ex) {
                        Object.keys(options.imageVersions).forEach(function(version) {
                            // TODO - Missing callback
                            fs.unlink(options.uploadDir + '/' + version + '/' + fileName);
                        });
                        callback(null, {
                            success: true
                        });
                    });
                    return;
                }
            }
            callback(new Error('File name invalid:' + fileName), null);
        }
    };

    return api;

};
