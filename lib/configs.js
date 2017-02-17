/*jslint node: true */
var checkExists     = require('./checkFolder.js');

var options = {
    tmpDir: __dirname + '/tmp',
    uploadDir: __dirname + '/public/files',
    uploadUrl: '/files/',
    maxPostSize: 11000000000, // 11 GB
    minFileSize: 1,
    maxFileSize: 10000000000, // 10 GB
    acceptFileTypes: /.+/i,
    acceptMimeTypes: [],
    copyImgAsThumb: true,
    useSSL: false,
    UUIDRegex: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
    // Files not matched by this regular expression force a download dialog,
    // to prevent executing any scripts in the context of the service domain:
    inlineFileTypes: /\.(gif|jpe?g|png)/i,
    imageTypes: /\.(gif|jpe?g|png)/i,
    imageVersions: {
      'thumbnail': {
        width: 99,
        height: 'auto'
      }
    },
    accessControl: {
      allowOrigin: '*',
      allowMethods: 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
      allowHeaders: 'Content-Type, Content-Range, Content-Disposition'
    },
    storage: {
      type: 'local',
      aws: {
        accessKeyId: null,
        secretAccessKey: null,
        region: null,
        bucketName: null,
        acl: 'public-read'
      }
    },
    /**
     * apply custom options to the default options
     */
    apply:function(opts){
         
        opts = opts || {};

        for(var c in opts ){
            if( this.specialApply(c,opts[c]) ) continue;
            this[c] = opts[c];
        }
        
        this.validate();

        return this;

    },

    specialApply:function(key,opt){
        //special properties that cann't apply simple copy
        var specialProperties = {
            'imageVersions':true,
            'accessControl':true,
            'storage':true
        };

        if(!specialProperties[key]) return false;

        switch(key){
            case 'imageVersions':
                this.imageVersions.thumbnail.width = opt.maxWidth || this.imageVersions.thumbnail.width;
                this.imageVersions.thumbnail.height = opt.maxHeight || this.imageVersions.thumbnail.height;
                Object.keys(opt).forEach(function(version) {
                    if (version != 'maxHeight' && version != 'maxWidth') {
                        options.imageVersions[version] = opt[version];
                    }
                });

            break;

            case 'accessControl':
                for(var c in opt){
                    this.accessControl[c] = opt[c];    
                }
            break;

            case 'storage':
                this.storage.type = opt.type || this.storage.type;
                if(opt.aws){
                    for(var c1 in opt.aws){
                        this.storage.aws[c1] = opt.aws[c1];    
                    }    
                }

            break;

        }//switch

        return true;
    },

    validate:function(){
        if ( this.storage.type === 'local' ) {
            checkExists(options.tmpDir);
            checkExists(options.uploadDir);
            if (options.copyImgAsThumb) {
                Object.keys(options.imageVersions).forEach(function(version) {
                    checkExists(options.uploadDir + '/' + version);
                });
            }
        }

        if( this.storage.type === 'aws') {
               
            if (!this.storage.aws.accessKeyId || !this.storage.aws.secretAccessKey || !this.storage.aws.bucketName) {
                throw new Error('Please enter valid AWS S3 details');
            }
        }
     
    }
};

/*
 * default configurations
 */
module.exports = options;
