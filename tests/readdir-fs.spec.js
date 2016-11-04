var expect = require('chai').expect;
var jsonData = require('./fixture/twodem');
var MemFS = require('../lib/memory-fs');

var memfs = new MemFS(jsonData);

describe('Memory-FS jsonReaddir tests', function() {
  it('should readdir of /', function(done) {
    expect(memfs.readdir).to.exists;

    memfs.readdir('/', function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.an('array');
      expect(data.length).to.equal(4);
      done();
    });
  });

  it('should readdir of /amadir', function(done) {
    memfs.readdir('/amadir', function(err, data) {
      expect(err).to.be.null;
      expect(data).to.be.an('array');
      done();
    });
  });

  it('should jsonReaddir of /', function(done) {
    expect(memfs.jsonReaddir).to.exists;

    memfs.jsonReaddir('/', function(err, data) {
      expect(data).to.be.an('array');
      expect(data[0]).to.be.an('object');
      expect(data[0].name).to.equal('hello.txt');
      done();
    });
  });

  it('should jsonReaddir of /amadir', function(done) {
    memfs.jsonReaddir('/amadir', function(err, data) {
      expect(data).to.be.an('array');
      expect(data[0]).to.be.an('object');
      expect(data[1]).to.be.an('object');
      expect(data[1].type).to.equal('file');
      expect(data[1].name).to.equal('anotherfile.txt');
      expect(data[0].name).to.equal('fileinside.txt');
      done();
    });
  });

  it('should return empty dir of /amadir/subdir', function(done) {
    memfs.jsonReaddir('/amadir/subdir', function(err, data) {
      expect(data).to.be.an('array');
      expect(data.length).to.equal(0);
      done();
    });
  });

  it('should handle jsonReaddir with extra "/"', function(done) {
    memfs.jsonReaddir('/amadir/subdir/', function(err, data) {
      expect(data).to.be.an('array');
      expect(data.length).to.equal(0);
      done();
    });
  });

  it('should handle not found /notexist', function(done) {
    memfs.jsonReaddir('/notexist', function(err, data) {
      expect(data).to.be.an('undefined');
      expect(err).to.be.a('string');
      expect(err).to.contain('Not Found');
      done();
    });
  });

  it('should handle not found /amadir/notexist', function(done) {
    memfs.jsonReaddir('/amadir/notexist', function(err, data) {
      expect(data).to.be.an('undefined');
      expect(err).to.contain('Not Found');
      done();
    });
  });
});

