var expect = require('chai').expect;
var _ = require('lodash');
var jsonData = require('./fixture/twodem');
var MemFS = require('../lib/memory-fs');

var memfs = new MemFS(_.cloneDeep(jsonData));


describe('Memory-FS rename tests', function() {

  it('should rename /hello.txt into h.txt',  function(done) {

  });

});
