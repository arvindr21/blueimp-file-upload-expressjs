var fs              = require('fs');
var FileInfo        = require('../fileinfo.js');
var lwip            = require('lwip');
var path            = require('path');
var async           = require('async');

module.exports = function(opts){

    var api = {
        options:opts, 
        /**
         * get files
         */
        get:function(callback){
            var files = [],
                options = this.options;
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
        proccessVersionFile:function(versionObj,cbk){
                
            var options = this.options;
            var retVal = versionObj;

            lwip.open(options.uploadDir+'/'+versionObj.fileInfo.name, function(error,image) {
            
                if(error) return cbk(error,versionObj.version);
                var opts0 = options.imageVersions[versionObj.version];
                if (opts0.height == 'auto') {
                    image.batch().resize(opts0.width).writeFile(options.uploadDir + '/' + versionObj.version + '/' + versionObj.fileInfo.name, function(err) {
                        if (err) {
                            cbk(err,retVal);
                            return;
                        }
                        cbk(null,retVal);
                    });
                    return;
                }
                image.batch().resize(opts0.width, opts0.height).writeFile(options.uploadDir + '/' + versionObj.version + '/' + versionObj.fileInfo.name, function(err) {
                    if (err) {
                        return cbk(err,retVal);
                    }
                    cbk(null,retVal);
                });

            });
        },
        post:function(fileInfo,file,finish){
        
            var me = this;
                options = this.options,
                versionFuncs = [];


            fs.renameSync(file.path, options.uploadDir + '/' + fileInfo.name);
            
            if( (!options.copyImgAsThumb) || (!options.imageTypes.test(fileInfo.name)) ) {
                fileInfo.initUrls(null);
                fileInfo.proccessed = true;
                return finish(null,fileInfo);    
            }

           
            Object.keys(options.imageVersions).forEach(function(version){
            
                versionFuncs.push({
                    version:version,
                    fileInfo:fileInfo
                });
            
            });


            async.map(versionFuncs,me.proccessVersionFile,function(err,results){
            
                console.log('results',results);
                
                results.forEach(function(v,i){
                    fileInfo.versions[v.version] = {err:v.err};    
                });
                fileInfo.initUrls(null);
                fileInfo.proccessed = true;
                finish(err,fileInfo);
                
            });


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
