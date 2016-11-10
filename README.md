### Virtual FS template

[![Build Status](https://travis-ci.org/b37t1td/virtualfs-template.svg?branch=master)](https://travis-ci.org/b37t1td/virtualfs-template)


Virtual FS is a general inmemory chaching template


### TODO

  - [x] Inmemory json fs
  - [x] List of files and folders
  - [x] Read files
  - [x] System (utimens, truncate)
  - [x] Create directories
  - [x] Remove directories
  - [x] Create files
  - [x] Remove files
  - [x] Write into files
  - [x] Handle rename

  ** Moving flat format as most useful and stable **
------------------------------------

  - [x] Crypto-cache caching
  - [x] Middleware calls 
  - [x] Separete encrypted cache from package
  - [x] Secure fs premissions


  ** Dummy middleware Template v0.2 **
------------------------------------
```js
var debouncy = require('debouncy');

var sync = debouncy(function(data) {
  return data;
}, 1000, null);

var Dummy = function() {

};

Dummy.prototype.fetch = function(json, callback) {
  setTimeout(function() {
    return callback(null, 'hello world');
  }, 2000);
};

Dummy.prototype.sync = function(json, callback) {
  sync(json);
  callback();
};

Dummy.prototype.post = function(json, buffer, callback) {
  callback();
};

Dummy.prototype.del = function(json, callback) {
  callback();
};

module.exports = Dummy;
```

  ** Mounted filesystem tests **
-----------------------------------
  - [ ] Tests for mountpoints
  - [ ] Test readdir listing
  - [ ] Test file writes
  - [ ] Test symlinks
  - [ ] Test directories mk/rm
  - [ ] Test file moving
  - [ ] Test removes
  - [ ] Test recursive removes


### LiCENSE

BDS
