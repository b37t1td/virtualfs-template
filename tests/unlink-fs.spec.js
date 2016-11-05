var expect = require('chai').expect;
var jsonData = require('./fixture/twodem');
var MemFS = require('../lib/memory-fs');

var memfs = new MemFS(jsonData);

var getNode = function(path, callback) {
  memfs.getattr(path, callback);
};

describe('Memory-FS unlink test', function() {

  it('should remove /hello.txt', function(done) {
    var path = '/hello.txt';

    memfs.unlink(path, function(err) {
      expect(err).to.be.null;

      getNode(path, function(err, data) {
        expect(err).to.not.be.null;
        expect(err).to.contain('Not Found');
        expect(data).to.be.an('undefined');
        done();
      });

    });
  });

  it('should remove /amadir/anotherfile.txt', function(done) {
    var path = '/amadir/anotherfile.txt';

    memfs.unlink(path, function(err) {
      expect(err).to.be.null;

      getNode(path, function(err, data) {
        expect(err).not.be.null;
        expect(data).to.be.an('undefined');
        done();
      });
    });
  }); 

  it('should handle unlink of /notexist.txt', function(done) {
    var path = '/notexist.txt';

    memfs.unlink(path, function(err) {
      expect(err).not.be.null;
      expect(err).contain('Not Found');
      done();
    });

  });

});
