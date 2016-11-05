var fuse = require('fuse-bindings');

var jsonData = require('../tests/fixture/twodem');
var MemFS = require('./memory-fs');

var memfs = new MemFS(jsonData);
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
  cb(0, 42);
};

var read = function (path, fd, buf, len, pos, cb) {
  memfs.read(path, function(err, data) {
    if (err) return cb(0);

    buf.write(data.slice(pos));
    return cb(data.length - pos);
  });
};

var unlink = function(path, cb) {
  memfs.unlink(path, function(err) {
    if (err) return cb(fuse.ENOSYS);
    return cb(0);
  });
};


fuse.mount(mountPath, {
  readdir: readdir,
  getattr: getattr,
  open: open,
  read: read,
  unlink : unlink
}, function (err) {
  if (err) throw err;
  console.log('filesystem mounted on ' + mountPath);
});

process.on('SIGINT', function () {
  fuse.unmount(mountPath, function (err) {
    if (err) {
      console.log('filesystem at ' + mountPath + ' not unmounted', err);
    } else {
      console.log('filesystem at ' + mountPath + ' unmounted');
    }
  });
});
