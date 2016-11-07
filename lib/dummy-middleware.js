var debouncy = require('debouncy');

var sync = debouncy(function(data) {
  return data;
}, 1000, null);

var Dummy = function() {

};

Dummy.prototype.fetch = function(path, callback) {
  setTimeout(function() {
    return callback(null, 'hello world');
  }, 2000);
};

Dummy.prototype.sync = function(json, callback) {
  sync(json);
  callback();
};

Dummy.prototype.post = function(path, buffer, callback) {
  callback();
};

Dummy.prototype.del = function(path, callback) {
  callback();
};

module.exports = Dummy;
