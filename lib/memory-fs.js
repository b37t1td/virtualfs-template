var FILE_MODE = 33152; //33188;
var DIR_MODE = 16832; //16877;

var NOT_FOUND = 'Not Found';
var UID = process.getuid();
var GID = process.getgid();
var MOUNT_DATE = new Date();

var Store = require('encrypted-cache');
var tmp = require('tmp'); // nodejs v4 support

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

var fakeMiddleware = {
  fetch : function(cb) { cb(); },
  sync  : function(j, cb) { cb(); },
  post  : function(name, buf, cb) { cb(); },
  del   : function(name, cb) { cb(); }
};

var MemFS = function(data, middleware) {
  this.middleware = middleware || fakeMiddleware;
  this.data = data;
  this.tmpDir = tmp.dirSync({mode : 0700, prefix : 'vfs-cache-'}).name;
  this.store = new Store(this.tmpDir);
  this.writeBuffer = {
    sync : false,
    path : null,
    buf : Buffer.alloc(0)
  };
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

MemFS.prototype.open = function(path, callback) {
  this.writeBuffer.path = path;
  this.writeBuffer.sync = false;
  this.writeBuffer.buf = Buffer.alloc(0);

  return callback(null);
};

MemFS.prototype.write = function(path, fd, buffer, length, position, callback) {
  this.writeBuffer.sync = true;
  this.writeBuffer.buf =
    Buffer.concat([this.writeBuffer.buf, buffer], position + length);
  return callback(null, length);
};

MemFS.prototype.read = function(path, fd, buffer, length, position, callback) {
  var self = this;

  var readNext = function() {
    buffer.write(self.writeBuffer.buf.slice(position, position + length));
    return callback(null, self.writeBuffer.buf.length - position);
  };

  if (this.writeBuffer.buf.length === 0) {
    return this.store.read(path, function(err, data) {
      if (err) {
        self.middleware.fetch(path, function(error, buf) {
          if (error) return callback(error);

          self.store.write(path, buf, function(e) {
            if (e) return callback(e);

            self.writeBuffer.buf = buf;
            readNext();
          });
        });
      } else {
        self.writeBuffer.buf = data.toString();
        readNext();
      }
    });
  }

  return readNext();
};

MemFS.prototype.release = function(path, fs, callback) {
  var self = this;
  if (this.writeBuffer.sync === true) {
    this.writeBuffer.sync = false;
    this.data = this.data.map(function(record) {
      if (record.path === path) {
        record.size = self.writeBuffer.buf.length;
      }
      return record;
    });
    this.store.write(path, this.writeBuffer.buf, function(err) {
      self.middleware.post(path, self.writeBuffer.buf, function(error) {

        self.writeBuffer.buf = Buffer.alloc(0);
        if (err || error) return callback(err || error);
        return callback(null);

      });
    });
  } else {
    self.writeBuffer.buf = Buffer.alloc(0);
    return callback(null);
  }
};

MemFS.prototype.rmdir = function(path, callback) {
  return this.unlink(path, callback);
};

MemFS.prototype.mkdir = function(path, callback) {
  return this.create(path, 'dir', callback);
};

MemFS.prototype.unlink = function(path, callback) {
  var self = this;

  if (!dirExists(this.data, path)) {
    return callback(NOT_FOUND);
  }

  this.getattr(path, function(err, data) {
    if (data.mode === FILE_MODE) {
      self.data = self.data.filter(function(record) {
        if (record.path === path) {
          self.store.remove(path, function() {});
          self.middleware.del(path, function() {});
        }
        return record.path !== path;
      });
    } else {
      var col = pathToArray(path);
      var parent = '/' + col.join('/');
      var regex = new RegExp('^' + parent);

      self.data = self.data.filter(function(record) {
        return !record.path.match(regex);
      });
    }
    self.middleware.sync(self.data, function() {
      callback(null);
    });
  });
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

  this.middleware.sync(this.data, function() {
    return callback(null);
  });
};

MemFS.prototype.rename = function(src, dst, callback) {
  var self = this;

  if (dirExists(this.data, dst)
    || !dirExists(this.data, src)
    || src === dst) {
    return callback(NOT_FOUND);
  }

  this.getattr(src, function(err, data) {
    if (data.mode === FILE_MODE) {
      self.data = self.data.map(function(record) {
        if (record.path === src) {
          self.store.rename(src, dst, function() {});
          record.path = dst;
        }
        return record;
      });
    } else {
      var col = pathToArray(src);
      var dest = '/' + pathToArray(dst).join('/');
      var parent = '/' + col.join('/');
      var regex = new RegExp('^' + parent);

      self.data = self.data.map(function(record) {
        var original = record.path;

        if (record.path.match(regex)) {
          record.path = record.path.replace(regex, dest);
          self.store.rename(original, record.path, function() {});
        }
        return record;
      });
    }

    self.middleware.sync(self.data, function() {
      callback(null);
    });
  });
};

MemFS.prototype.getData = function() {
  return this.data;
};

MemFS.prototype.setData = function(data) {
  this.data = data;
};

module.exports = MemFS;
