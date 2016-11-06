var FILE_MODE = 33188;
var DIR_MODE =16877;

var NOT_FOUND = 'Not Found';
var UID = process.getuid();
var GID = process.getgid();
var MOUNT_DATE = new Date();


var pathToArray = function(path) {
  return path
    .replace(/\/\//gi,'/')
    .replace(/\/$/,'')
    .split('/').slice(1);
};

var dirExists = function(json, path) {
  if (path === '/') {
    return true;
  }

  return json.filter(function(record) {
    return record.path === path;
  }).length > 0;
};

var findDir = function(json, path) {
  if (dirExists(json, path)) {
    return json.filter(function(record) {
      return record.path === path;
    })[0];
  }

  return null;
};

var readJSONDir = function(json, path) {
  var col = pathToArray(path);
  var parent = col.length < 1 ? col.join('/') : '/' + col.join('/');
  var regex = new RegExp('^' + parent + '\/[^\\\/]*$');

  return json.filter(function(record) {
    return record.path.match(regex);
  });
};

var getFileName = function(path) {
  var col = pathToArray(path);
  return col.pop();
};

var MemFS = function(data) {
  this.data = data;
};

MemFS.prototype.getattr = function(path, callback) {
  if (!dirExists(this.data, path)) {
    return callback(NOT_FOUND);
  }

  var record = findDir(this.data, path) || {};
  var dir = {};

  dir.uid = UID;
  dir.gid = GID;

  dir.ctime = MOUNT_DATE;
  dir.mtime = MOUNT_DATE;
  dir.atime = MOUNT_DATE;

  dir.mode = (record.type === 'file') ? FILE_MODE : DIR_MODE;
  dir.size = 4096;

  if (record.hasOwnProperty('size')) {
    dir.size = record.size;
  }

  callback(null, dir);
};

MemFS.prototype.readdir = function(path, callback) {
  var sortFs = function(a, b) {
    var nameA = a.toUpperCase();
    var nameB = b.toUpperCase();
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  };

  if (!dirExists(this.data, path)) {
    return callback(NOT_FOUND);
  }

  var data = readJSONDir(this.data, path);

  var dirs = data
    .filter(function(record) {
      return record.type === 'dir';
    })
    .map(function(record) {
      return getFileName(record.path);
    })
    .sort(sortFs);
  var files = data
    .filter(function(record) {
      return record.type === 'file';
    })
    .map(function(record) {
      return getFileName(record.path);
    })
    .sort(sortFs);

  return callback(null, dirs.concat(files));
};

MemFS.prototype.read = function(path, callback) {
  return callback(null, 'test');
};

MemFS.prototype.rmdir = function(path, callback) {
  return this.unlink(path, callback);
};

MemFS.prototype.mkdir = function(path, callback) {
  return this.create(path, 'dir', callback);
};

MemFS.prototype.unlink = function(path, callback) {
  if (!dirExists(this.data, path)) {
    callback(NOT_FOUND);
  }

  var regex = RegExp('^' + path);

  this.data = this.data.filter(function(record) {
    return !record.path.match(regex);
  });

  return callback(null);
};

MemFS.prototype.create = function(path, mode, callback) {
  var col = pathToArray(path);
  var parent = '/' + col.slice(0, col.length - 1).join('/');

  if (!dirExists(this.data, parent) || dirExists(this.data, path)) {
    return callback(NOT_FOUND);
  }

  var item = {
    path : path,
    type : mode
  };

  if (mode === 'file') {
    item.size = 0;
  }

  this.data.push(item);

  return callback(null);
};

MemFS.prototype.write = function(path, buffer) {
  return buffer;
};

MemFS.prototype.rename = function(src, dst, callback) {
  callback(null);
};

MemFS.prototype.getData = function() {
  return this.data;
};

MemFS.prototype.setData = function(data) {
  this.data = data;
};

module.exports = MemFS;


