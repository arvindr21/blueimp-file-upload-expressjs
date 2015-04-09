'use strict';
describe('FileInfo package', function() {
  var FileInfo = require('../lib/fileinfo.js');
  // TODO - FileInfo default constructor or mock parameters

  it('should provide a safe name for new files');

  it('should generate URLs for the files');

  it('should check against certain rules');

  it('should check or create folders');
});

describe('AWS transport package', function() {
  var uploadFileAWS = require('../lib/transport/aws.js');
});

describe('Uploader configuration', function() {
  var options;
  var uploader;

  beforeEach(function() {
    // TODO - Create a mock object for the filesystem
    uploader = require('../index');
  });
 
  it('can require configs without error',function(){
    var configs = require('../lib/configs.js');
    expect(configs).not.toBe(null);
  });

  it('should have default config values', function() {
    options = {};
    expect(uploader(options).config).toBeDefined();
  });

  it('should support the local filesystem', function() {
    options = {
      tmpDir: 'tmp/foo',
      uploadDir: 'tmp/bar'
    };
    expect(uploader(options).config.tmpDir).toEqual('tmp/foo');
    expect(uploader(options).config.uploadDir).toEqual('tmp/bar');
  });

  it('should support Amazon Simple Storage Service', function() {
    var awsConfig = {
      type: 'aws',
      aws: {
        accessKeyId: 'sesame',
        secretAccessKey: 'open',
        region: 'us-west-2',
        bucketName: 'ali-baba',
        acl: 'private'
      }
    };
    options = {
      storage: awsConfig
    };
    expect(uploader(options).config.storage).toEqual(awsConfig);
  });

  it('should support thumbnails generation', function() {
    var thumbsConfig = {
      maxWidth: 200,
      maxHeight: 'auto',
      large: {
        width: 600,
        height: 600
      },
      medium: {
        width: 300,
        height: 300
      },
      small: {
        width: 150,
        height: 150
      }
    }
    options = {
      imageVersions: thumbsConfig
    };
    var obj = uploader(options);
    
    expect(obj.config.imageVersions.thumbnail.width).toEqual(thumbsConfig.maxWidth);
    expect(obj.config.imageVersions.thumbnail.height).toEqual(thumbsConfig.maxHeight);
    expect(obj.config.imageVersions.large).toEqual(thumbsConfig.large);
    expect(obj.config.imageVersions.medium).toEqual(thumbsConfig.medium);
    expect(obj.config.imageVersions.small).toEqual(thumbsConfig.small);
  });

  it('should allow disabling thumbnails', function() {
    options = {
      copyImgAsThumb: true
    };
    expect(uploader(options).config.copyImgAsThumb).toBe(true);
  });

  it('should support SSL', function() {
    options = {
      useSSL: true
    };
    expect(uploader(options).config.useSSL).toBe(true);
  });
});

describe('Uploader REST services', function() {
  var options = {};
  var uploader = require('../index')(options);

  it('should provide a GET method', function() {
    expect(uploader.get).toBeDefined();
    expect(uploader.get.length).toEqual(3);
  });

  it('should provide a POST method', function() {
    expect(uploader.post).toBeDefined();
    expect(uploader.post.length).toEqual(3);
  });

  it('should provide a DELETE method', function() {
    expect(uploader.delete).toBeDefined();
    expect(uploader.delete.length).toEqual(3);
  });
});
