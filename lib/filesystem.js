var fuse = require('fuse-bindings');
var fs = require('fs');

//var jsonData = require('../tests/fixture/flat');
var MemFS = require('./memory-fs');

var memfs = new MemFS([]);
var mountPath = process.platform !== 'win32' ? './mnt' : 'M:\\';


var readdir = function(path, cb) {
  memfs.readdir(path, function(err, data) {
    if (err) {
      return cb(0);
    }
    return cb(0, data);
  });
};

var getattr = function(path, cb) {
  memfs.getattr(path, function(err, data) {
    if (err) {
      return cb(fuse.ENOENT);
    }
    return cb(0, data);
  });
};


var open = function(path, flags, cb) {
  memfs.open(path, function(err) {
    if (err) {
      return cb(fuse.ENOENT);
    }
    cb(0);
  });
};

var unlink = function(path, cb) {
  memfs.unlink(path, function(err) {
    if (err) return cb(fuse.ENOSYS);
    return cb(0);
  });
};

var create = function(path, mode, cb) {
  memfs.create(path, 'file', function(err) {
    if (err) return cb(fuse.EFAULT);
    return cb(0);
  });
};

var write = function(path, fd, buffer, length, position, cb) {
  memfs.write(path, fd, buffer, length, position, function(err, len) {
    if (err) return cb(fuse.ENOSYS);
    return cb(len);
  });
};

var read = function (path, fd, buffer, length, position, cb) {
  memfs.read(path, fd, buffer, length, position, function(err, len) {
    if (err) return cb(fuse.ENOSYS);
    cb(len);
  });
};

var release = function(path, fd, cb) {
  memfs.release(path, fd, function(err) {
    if (err) return cb(fuse.ENOSYS);
    cb(0);
  });
};

var rename = function(src, dst, cb) {
  memfs.rename(src, dst, function(err) {
    if (err) return cb(fuse.ENOSYS);
    cb(0);
  });
};

var truncate = function(path, len, cb) {
  cb(0);
};

var utimens = function(path, ctime, atime, cb) {
  if (typeof cb === 'function') {
    cb(0);
  }
};

var mkdir = function(path, mode, cb) {
  memfs.create(path, 'dir', function(err) {
    if (err) return cb(fuse.EFAULT);
    return cb(0);
  });
};

var rmdir = function(path, cb) {
  memfs.rmdir(path, function(err) {
    if (err) return cb(fuse.ENOSYS);
    return cb(0);
  });
};


fuse.mount(mountPath, {
  readdir: readdir,
  getattr: getattr,
  open: open,
  read: read,
  unlink : unlink,
  create : create,
  write : write,
  truncate : truncate,
  utimens : utimens,
  mkdir : mkdir,
  rmdir : rmdir,
  rename : rename,
  release : release
}, function (err) {
  if (err) throw err;
  console.log('filesystem mounted on ' + mountPath);
});

process.on('SIGINT', function () {

  memfs.store.clean();
  fs.rmdirSync(memfs.tmpDir);
  fuse.unmount(mountPath, function (err) {
    if (err) {
      console.log('filesystem at ' + mountPath + ' not unmounted', err);
    } else {
      console.log('filesystem at ' + mountPath + ' unmounted');
    }
  });
});
