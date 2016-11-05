var _ = require('lodash');

var FILE_MODE = 33188;
var DIR_MODE =16877;
var NOT_FOUND = 'Not Found';
var UID = process.getuid();
var GID = process.getgid();
var MOUNT_DATE = new Date();

var treeContent = function(data, dir, opts) {
  opts = opts || {};
  for (var i = 0; i < data.length; i++) {
    if (data[i] === undefined || data[i] === null) {
      continue;
    }

    if (data[i].name === dir) {
      if (data[i].type === 'dir' && !opts.nostrip) {
        return data[i].content;
      } else if (data[i].type == 'file' || opts.nostrip) {
        return data[i];
      }
    }
  }
  return false;
};

var pathToArray = function(path) {
  return path
    .replace(/\/\//gi,'/')
    .replace(/\/$/,'')
    .split('/').slice(1);
};

var readJSONDir = function(json, dir, opts) {
  var col = pathToArray(dir);

  if (col.length === 1 && col[0].length === 0) {
    return json;
  }

  var tree = json;
  for (var i = 0 ; i < col.length && tree !== false; i++) {
    tree = treeContent(tree, col[i], opts);
  }
  return tree;
};


var MemFS = function(data) {
  this.data = data;
};

MemFS.prototype.getattr = function(path, callback) {
  var dir = readJSONDir(this.data, path);

  if (!dir) {
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
      dir.size = dir.content ? dir.content.length : 0;
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

    return callback(null, data
      .filter(function(d) { return d ? true : false ; })
      .map(function(d) { return d.name; }));
  });
};

MemFS.prototype.read = function(path, callback) {
  this.jsonReaddir(path, function(err, data) {
    if (err || data.type !== 'file') return callback(err);

    return callback(null, data.content ? data.content : '');
  });
};


MemFS.prototype.rmdir = function(path, callback) {
  var itemRemove = readJSONDir(this.data, path, {nostrip : true});

  if (!itemRemove) {
    return callback(NOT_FOUND);
  }

  this.data = _.cloneDeepWith(this.data, function(item) {
    if (item === itemRemove) {
      return null;
    }
  });

  return callback(null);
};

MemFS.prototype.unlink = function(path, callback) {
  var itemRemove = readJSONDir(this.data, path);

  if (!itemRemove) {
    return callback(NOT_FOUND);
  }

  this.data = _.cloneDeepWith(this.data, function(item) {
    if (item === itemRemove) {
      return null;
    }
  });

  return callback(null);
};

MemFS.prototype.create = function(path, mode, callback) {
  var col = pathToArray(path);
  var parent = '/' + col.slice(0, col.length -1).join('/');

  var item = {
    name : col.pop(),
    type : mode === 'file' ? 'file' : 'dir',
    content : mode === 'file' ? false : []
  };

  var itemParent = readJSONDir(this.data, parent);

  if (!itemParent || itemParent.filter(
    function(i) { return i && i.name === item.name; }).length !== 0) {
    return callback(NOT_FOUND);
  }

  this.data = _.cloneDeepWith(this.data, function(node) {
    if (node === itemParent) {
      node.push(item);
      return node.slice();
    }
  });

  return callback(null);
};

MemFS.prototype.getData = function() {
  return this.data;
};

MemFS.prototype.setData = function(data) {
  this.data = data;
};

module.exports = MemFS;


