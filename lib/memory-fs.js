var FILE_MODE = 33188;
var DIR_MODE =16877;
var NOT_FOUND = 'Not Found';
var UID = process.getuid();
var GID = process.getgid();
var MOUNT_DATE = new Date();

var treeContent = function(data, dir) {
  for (var i = 0; i < data.length; i++) {
    if (data[i].name === dir) {
      if (data[i].type === 'dir') {
        return data[i].content;
      } else if (data[i].type == 'file') {
        return data[i];
      }
    }
  }
  return false;
};

var readJSONDir = function(json, dir) {
  var col = dir
    .replace(/\/\//gi,'/')
    .replace(/\/$/,'')
    .split('/').slice(1);

  if (col.length === 1 && col[0].length === 0) {
    return json;
  }

  var tree = json;
  for (var i = 0 ; i < col.length && tree !== false; i++) {
    tree = treeContent(tree, col[i]);
  }
  return tree;
};


var MemFS = function(data) {
  this.data = data;
};

MemFS.prototype.getattr = function(path, callback) {
  var dir = readJSONDir(this.data, path);

  if (dir === false) {
    return callback(NOT_FOUND);
  }

  if (Array.isArray(dir)) {
    dir = {};
  }

  dir.uid = UID;
  dir.gid = GID;

  if (!dir.hasOwnProperty('type') || dir.type === 'dir') {
    dir.mode = DIR_MODE;
  } else {
    dir.mode = FILE_MODE;
  }

  if (!dir.hasOwnProperty('size')) {
    if (dir.type === 'dir' || !dir.hasOwnProperty('content')) {
      dir.size = 4096;
    } else {
      dir.size = dir.content.length;
    }
  }

  if (!dir.hasOwnProperty('ctime')) {
    dir.ctime = MOUNT_DATE;
  }

  if (!dir.hasOwnProperty('mtime')) {
    dir.mtime = MOUNT_DATE;
  }

  if (!dir.hasOwnProperty('atime')) {
    dir.atime = MOUNT_DATE;
  }

  callback(null, dir);
};

MemFS.prototype.jsonReaddir = function(path, callback) {
  var content = readJSONDir(this.data, path);

  if (content === false) {
    return callback(NOT_FOUND);
  }

  callback(null, content);
};

MemFS.prototype.readdir = function(path, callback) {
  this.jsonReaddir(path, function(err, data) {
    if (err) return callback(err);

    return callback(null, data.map(function(d) { return d.name; }));
  });
};

MemFS.prototype.read = function(path, callback) {
  this.jsonReaddir(path, function(err, data) {
    if (err || data.type !== 'file') return callback(err);

    return callback(null, data.content);
  });
};

MemFS.prototype.getData = function() {
  return this.data;
};

MemFS.prototype.setData = function(data) {
  this.data = data;
};

module.exports = MemFS;


