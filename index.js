module.exports = function (opts) {
    var path = require('path'),
        fs = require('fs'),
        _existsSync = fs.existsSync || path.existsSync,
        formidable = require('formidable'),
        nameCountRegexp = /(?:(?: \(([\d]+)\))?(\.[^.]+))?$/,

        options = {
            tmpDir: opts.tmpDir || __dirname + '/tmp',
            publicDir: opts.publicDir || __dirname + '/public',
            uploadDir: opts.uploadDir || __dirname + '/public/files',
            uploadUrl: opts.uploadUrl || '/files/',
            maxPostSize: opts.maxPostSize || 11000000000, // 11 GB
            minFileSize: opts.minFileSize || 1,
            maxFileSize: opts.maxFileSize || 10000000000, // 10 GB
            acceptFileTypes: opts.acceptFileTypes || /.+/i,
            copyImgAsThumb: opts.copyImgAsThumb || true,
            // Files not matched by this regular expression force a download dialog,
            // to prevent executing any scripts in the context of the service domain:
            inlineFileTypes: opts.inlineFileTypes || /\.(gif|jpe?g|png)$/i,
            imageTypes: opts.imageTypes || /\.(gif|jpe?g|png)$/i,
            imageVersions: {
                'thumbnail': {
                    width: opts.imageVersions.width || 80,
                    height: opts.imageVersions.height || 80
                }
            },
            accessControl: {
                allowOrigin: opts.accessControl.allowOrigin || '*',
                allowMethods: opts.accessControl.allowMethods || 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
                allowHeaders: opts.accessControl.allowHeaders || 'Content-Type, Content-Range, Content-Disposition'
            }
            /* Uncomment and edit this section to provide the service via HTTPS:
            // You need to manually uncomment and pass the value. Options does not have 
            // a placeholder for these 2.
            ssl: {
                key: fs.readFileSync('/Applications/XAMPP/etc/ssl.key/server.key'),
                cert: fs.readFileSync('/Applications/XAMPP/etc/ssl.crt/server.crt')
            },
            */
        };

        checkExists(options.tmpDir);
        checkExists(options.publicDir);
        checkExists(options.uploadDir);
        checkExists(options.uploadDir+'/thumbnail');

        // check if upload folders exists
        function checkExists(dir)
        {
            fs.exists(dir, function(exists){
                if(!exists)
                {
                     throw new Error(dir + ' does not exists. Please create the folder');
                }
            });
        }

    var utf8encode = function (str) {
        return unescape(encodeURIComponent(str));
    };
    var nameCountFunc = function (s, index, ext) {
        return ' (' + ((parseInt(index, 10) || 0) + 1) + ')' + (ext || '');
    };
    var FileInfo = function (file) {
        this.name = file.name;
        this.size = file.size;
        this.type = file.type;
        this.deleteType = 'DELETE';
    };

    FileInfo.prototype.safeName = function () {
        // Prevent directory traversal and creating hidden system files:
        this.name = path.basename(this.name).replace(/^\.+/, '');
        // Prevent overwriting existing files:
        while (_existsSync(options.uploadDir + '/' + this.name)) {
            this.name = this.name.replace(nameCountRegexp, nameCountFunc);
        }
    };

    FileInfo.prototype.initUrls = function (req) {
        if (!this.error) {
            var that = this,
                baseUrl = (options.ssl ? 'https:' : 'http:') +
                '//' + req.headers.host + options.uploadUrl;
            this.url = this.deleteUrl = baseUrl + encodeURIComponent(this.name);
            Object.keys(options.imageVersions).forEach(function (version) {
                if (_existsSync(
                    options.uploadDir + '/' + version + '/' + that.name
                )) {
                    that[version + 'Url'] = baseUrl + version + '/' +
                        encodeURIComponent(that.name);
                }
            });
        }
    };

    FileInfo.prototype.validate = function () {
        if (options.minFileSize && options.minFileSize > this.size) {
            this.error = 'File is too small';
        } else if (options.maxFileSize && options.maxFileSize < this.size) {
            this.error = 'File is too big';
        } else if (!options.acceptFileTypes.test(this.name)) {
            this.error = 'Filetype not allowed';
        }
        return !this.error;
    };

    var setNoCacheHeaders = function (res) {
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Content-Disposition', 'inline; filename="files.json"');
    }
    var fileUploader = {};

    fileUploader.get = function (req, res, callback) {
        setNoCacheHeaders(res);
        var files = [];
        fs.readdir(options.uploadDir, function (err, list) {
            list.forEach(function (name) {
                var stats = fs.statSync(options.uploadDir + '/' + name),
                    fileInfo;
                if (stats.isFile() && name[0] !== '.') {
                    fileInfo = new FileInfo({
                        name: name,
                        size: stats.size
                    });
                    fileInfo.initUrls(req);
                    files.push(fileInfo);
                }
            });
            callback({
                files: files
            });
        });
    };

    fileUploader.post = function (req, res, callback) {
        setNoCacheHeaders(res);
        var form = new formidable.IncomingForm(),
            tmpFiles = [],
            files = [],
            map = {},
            counter = 1,
            redirect,
            finish = function () {
                counter -= 1;
                if (!counter) {
                    files.forEach(function (fileInfo) {
                        fileInfo.initUrls(req);
                    });
                    callback({
                        files: files
                    }, redirect);
                }
            };

        form.uploadDir = options.tmpDir;

        form.on('fileBegin', function (name, file) {
            tmpFiles.push(file.path);
            var fileInfo = new FileInfo(file, req, true);
            fileInfo.safeName();
            map[path.basename(file.path)] = fileInfo;
            files.push(fileInfo);
        }).on('field', function (name, value) {
            if (name === 'redirect') {
                redirect = value;
            }
        }).on('file', function (name, file) {
            var fileInfo = map[path.basename(file.path)];
            fileInfo.size = file.size;
            if (!fileInfo.validate()) {
                fs.unlink(file.path);
                return;
            }
            fs.renameSync(file.path, options.uploadDir + '/' + fileInfo.name);
            if (options.imageTypes.test(fileInfo.name)) {
                Object.keys(options.imageVersions).forEach(function (version) {
                    counter += 1;
                    var opts = options.imageVersions[version];
                    if (options.copyImgAsThumb) {
                        fs.readFile(options.uploadDir + '/' + fileInfo.name, function (err, data) {
                            if (err) throw err;
                            fs.writeFile(options.uploadDir + '/' + version + '/' +
                                fileInfo.name, data, function (err, stderr, stdout) {
                                    if (err) throw err;
                                    //console.log(err, stderr, stdout)
                                    finish();
                                });
                        });
                    }
                });
            }
        }).on('aborted', function () {
            tmpFiles.forEach(function (file) {
                fs.unlink(file);
            });
        }).on('error', function (e) {
            console.log(e);
        }).on('progress', function (bytesReceived) {
            if (bytesReceived > options.maxPostSize) {
                req.connection.destroy();
            }
        }).on('end', finish).parse(req);
    };

    fileUploader.delete = function (req, res, callback) {
        var fileName;
        if (req.url.slice(0, options.uploadUrl.length) === options.uploadUrl) {
            fileName = path.basename(decodeURIComponent(req.url));
            if (fileName[0] !== '.') {
                fs.unlink(options.uploadDir + '/' + fileName, function (ex) {
                    Object.keys(options.imageVersions).forEach(function (version) {
                        fs.unlink(options.uploadDir + '/' + version + '/' + fileName, function (err) {
                            //if (err) throw err;
                        });
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
    };

    return fileUploader;
};