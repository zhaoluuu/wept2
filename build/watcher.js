'use strict';

var chokidar = require('chokidar');
var growl = require('growl');
var cache = require('./cache');
var parser = require('./parser');
var chalk = require('chalk');
var path = require('path');
var fs = require('fs');
var util = require('./util');
var builder = require('./builder');
var config = require('./config');

module.exports = function (socket) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  chokidar.watch('.', { ignored: /node_modules/ }).on('change', function (path) {
    path = util.normalizePath(path);
    if (/\.json$/.test(path)) {
      fs.readFile(path, 'utf8', function (err, content) {
        if (err) return;
        var data = void 0;
        try {
          data = JSON.parse(content);
        } catch (e) {
          util.notifyError(e);
          return socket.send({ type: 'error', msg: path + ' \u89E3\u6790\u9519\u8BEF\uFF0C\u8BF7\u68C0\u67E5' });
        }
        growl('Reloading ' + path, { image: 'Safari', title: 'liveload' });
        socket.send({
          type: 'reload',
          path: path,
          content: data
        });
      });
    } else if (/\.js/.test(path)) {
      onReload(socket, path);
      builder.buildFile(path);
    } else if (/\.(wxss|wxml)$/.test(path)) {
      config().then(function (conf) {
        var pages = conf.pages;
        var isGlobal = pages.indexOf(path.replace(/\.\w+$/, '')) == -1;
        if (/\.wxss$/.test(path) && isGlobal && 'app.wxss' !== path) {
          var files = cache.getRelatedWxssFiles(path);
          files.forEach(function (file) {
            wrapParser(socket, file.replace(/^\.\//, ''), opts.debug);
          });
        } else {
          wrapParser(socket, path, opts.debug);
        }
      }, function (e) {
        util.notifyError(e);
      });
    }
  });

  if (!/wept$/.test(process.argv[1])) {
    chokidar.watch(path.resolve(__dirname, '../public/script/build.js')).on('change', function () {
      growl('Reloading build.js', { image: 'Safari', title: 'liveload' });
      socket.send({ type: 'reload' });
    });
  }
};

function wrapParser(socket, path, debug) {
  onReload(socket, path);
  parser(path).then(function (str) {
    if (debug) console.log(str);
    console.log(chalk.green(' \u2713 ' + path + ' rebuild success'));
  }, function (err) {
    console.log(chalk.red(' \u2717 ' + path + ' rebuild error\n' + err.message));
    util.notifyError(err);
  });
}

function onReload(socket, path) {
  cache.del(path);
  socket.send({ type: 'reload', path: path });
  growl('Reloading ' + path, { image: 'Safari', title: 'liveload' });
}
//# sourceMappingURL=watcher.js.map
