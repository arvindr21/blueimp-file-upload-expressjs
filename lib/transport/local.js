var fs              = require('fs');
var FileInfo        = require('../fileinfo.js');
var lwip            = require('lwip');
module.exports = function(options){

    var api = {
        options:options, 
        /**
         * get files
         */
        get:function(callback){
            var files = [];
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
                callback(null,{files: files});
            });
        },
        post:function(fileInfo,file,finish){
        
            var options = api.options;
            var versions = {};

            fs.renameSync(file.path, options.uploadDir + '/' + fileInfo.name);
            if (options.copyImgAsThumb && options.imageTypes.test(fileInfo.name)) {
                Object.keys(options.imageVersions).forEach(function(version) {
                    finish.counter += 1;
                    versions[version] = {}; 
                    var opts = options.imageVersions[version];
                    lwip.open(options.uploadDir + '/' + fileInfo.name, function(error, image) {
                        if(error) {
                            console.log('lwip.open',error);
                            versions[version].err = error;
                            finish(error,null,versions);
                            return;
                        }
                        if (opts.height == 'auto') {
                            image.batch().resize(opts.width).writeFile(options.uploadDir + '/' + version + '/' + fileInfo.name, function(err) {
                                if (err) {
                                    versions[version].err = err;
                                    finish(err,null,versions);
                                    return;
                                }
                                finish(null,null,versions);
                            });
                        } else {
                            image.batch().resize(opts.width, opts.height).writeFile(options.uploadDir + '/' + version + '/' + fileInfo.name, function(err) {
                                if (err) {
                                    versions[version].err = err;
                                    return finish(err,null,versions);
                                }
                                finish(null,null,versions);
                            });
                        }
                    });
                });
            }//if
        },
        delete:function(req,res,callback){
            var options = api.options;
            var fileName = '';
            if (req.url.slice(0, options.uploadUrl.length) === options.uploadUrl) {
                fileName = path.basename(decodeURIComponent(req.url));
                if (fileName[0] !== '.') {
                    fs.unlink(options.uploadDir + '/' + fileName, function(ex) {
                        Object.keys(options.imageVersions).forEach(function(version) {
                            // TODO - Missing callback
                            fs.unlink(options.uploadDir + '/' + version + '/' + fileName);
                        });
                        callback(ex);
                    });
                    return;
                }
            }
            callback('File name invalid:'+fileName);
        }
    };

    return api;

};
