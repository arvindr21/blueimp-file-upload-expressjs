'use strict';

describe('Uploader configuration', function() {
  var options;
  var uploader;

  it('should have default config values', function() {
    options = {};
    uploader = require('../index')(options);
    expect(uploader).toBeDefined();
  });

  // TODO : Refactor code to be able to test the Specs below
  it('should support local filesystem');

  it('should support Amazon Simple Storage Service');

  it('should support thumbnails generation');

  it('should support SSL');
});

describe('Uploader REST services', function() {
  var options = {};
  var uploader = require('../index')(options);

  it('should provide a GET method', function() {
    expect(uploader.get).toBeDefined();
    expect(uploader.post.length).toEqual(3);
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