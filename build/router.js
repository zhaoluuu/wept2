'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = require('fs');
var path = require('path');
var send = require('koa-send');
var mkdir = require('mkdir-p');
var crypto = require('crypto');
var loadConfig = require('./config');
var util = require('./util');
var cache = require('./cache');
var parser = require('./parser');
var router = require('koa-router')();
var hash_dir = crypto.createHash('md5').update(process.cwd()).digest("hex");
var formidable = require('koa-formidable');
var osTmp = require('os').tmpdir();
var tmpDir = path.join(osTmp, hash_dir);
mkdir.sync(tmpDir);
var root = require('os').platform == "win32" ? process.cwd().split(path.sep)[0] : "/";
var version = require('../package.json').version;
var builder = require('./builder');
var api = require('./api');

function escape(x) {
  return x;
}

function noext(str) {
  return str.replace(/\.\w+$/, '');
}

function loadFile(p) {
  var throwErr = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

  if (/\.wxss$/.test(p)) throwErr = false;
  return new _promise2.default(function (resolve, reject) {
    fs.stat('./' + p, function (err, stats) {
      if (err) {
        if (throwErr) return reject(new Error('file ' + p + ' not found'));
        return resolve('');
      }
      if (stats && stats.isFile()) {
        var content = cache.get(p);
        if (content) {
          return resolve(content);
        } else {
          return parser('' + p).then(resolve, reject);
        }
      } else {
        return resolve('');
      }
    });
  });
}

router.get('/', _regenerator2.default.mark(function _callee() {
  var _ref, _ref2, config, rootFn, pageConfig, tabBar;

  return _regenerator2.default.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return [loadConfig(), util.loadTemplate('index')];

        case 2:
          _ref = _context.sent;
          _ref2 = (0, _slicedToArray3.default)(_ref, 2);
          config = _ref2[0];
          rootFn = _ref2[1];
          _context.next = 8;
          return util.loadJSONfiles(config.pages);

        case 8:
          pageConfig = _context.sent;

          config['window'].pages = pageConfig;
          tabBar = config.tabBar;

          this.body = rootFn({
            config: (0, _stringify2.default)(config),
            root: config.root,
            ip: util.getIp(),
            topBar: tabBar && tabBar.position == 'top',
            version: version
          }, {}, escape);
          this.type = 'html';
          //yield next

        case 13:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, this);
}));

router.get('/appservice', _regenerator2.default.mark(function _callee2() {
  var _ref3, _ref4, config, serviceFn;

  return _regenerator2.default.wrap(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return [loadConfig(), util.loadTemplate('service')];

        case 2:
          _ref3 = _context2.sent;
          _ref4 = (0, _slicedToArray3.default)(_ref3, 2);
          config = _ref4[0];
          serviceFn = _ref4[1];

          this.body = serviceFn({
            version: version,
            config: (0, _stringify2.default)(config)
          }, { noext: noext }, escape);
          this.type = 'html';

        case 8:
        case 'end':
          return _context2.stop();
      }
    }
  }, _callee2, this);
}));

router.get('/generateFunc', _regenerator2.default.mark(function _callee3() {
  return _regenerator2.default.wrap(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return loadFile(this.query.path + '.wxml');

        case 2:
          this.body = _context3.sent;

          this.type = 'text';

        case 4:
        case 'end':
          return _context3.stop();
      }
    }
  }, _callee3, this);
}));

router.get('/generateJavascript', _regenerator2.default.mark(function _callee4() {
  return _regenerator2.default.wrap(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return loadFile(this.query.path);

        case 2:
          this.body = _context4.sent;

          this.type = 'text';

        case 4:
        case 'end':
          return _context4.stop();
      }
    }
  }, _callee4, this);
}));

router.get('/fileList', _regenerator2.default.mark(function _callee5() {
  return _regenerator2.default.wrap(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return api.getFileList(tmpDir);

        case 2:
          this.body = _context5.sent;

          this.type = 'json';

        case 4:
        case 'end':
          return _context5.stop();
      }
    }
  }, _callee5, this);
}));

router.get('/fileInfo', _regenerator2.default.mark(function _callee6() {
  return _regenerator2.default.wrap(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.next = 2;
          return api.getFileInfo(this.query.filePath);

        case 2:
          this.body = _context6.sent;

          this.type = 'json';

        case 4:
        case 'end':
          return _context6.stop();
      }
    }
  }, _callee6, this);
}));

router.post('/removeFile', _regenerator2.default.mark(function _callee7() {
  return _regenerator2.default.wrap(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.next = 2;
          return api.removeFile(this.query.filePath);

        case 2:
          this.body = _context7.sent;

          this.type = 'json';

        case 4:
        case 'end':
          return _context7.stop();
      }
    }
  }, _callee7, this);
}));

router.get(tmpDir + '/(.*)', _regenerator2.default.mark(function _callee8() {
  return _regenerator2.default.wrap(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.next = 2;
          return send(this, this.request.path, { root: root });

        case 2:
        case 'end':
          return _context8.stop();
      }
    }
  }, _callee8, this);
}));

router.get('/service.js', _regenerator2.default.mark(function _callee9() {
  return _regenerator2.default.wrap(function _callee9$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.next = 2;
          return builder.load();

        case 2:
          this.body = _context9.sent;

          this.type = 'application/javascript';

        case 4:
        case 'end':
          return _context9.stop();
      }
    }
  }, _callee9, this);
}));

router.get('/app/(.*)', _regenerator2.default.mark(function _callee10() {
  var p, file, content, _content, _ref5, _ref6, config, exists, _ref7, _ref8, _content2, viewFn, _exists;

  return _regenerator2.default.wrap(function _callee10$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          p = this.request.path;
          file = p.replace(/^\/app\//, '');

          if (!/\.wxss/.test(file)) {
            _context10.next = 10;
            break;
          }

          _context10.next = 5;
          return loadFile(file);

        case 5:
          content = _context10.sent;

          this.body = util.parseCss(content, this.query.w, this.query.r);
          this.type = 'css';
          _context10.next = 48;
          break;

        case 10:
          if (!/\.js$/.test(file)) {
            _context10.next = 18;
            break;
          }

          _context10.next = 13;
          return loadFile(file);

        case 13:
          _content = _context10.sent;

          this.body = _content;
          this.type = 'javascript';
          _context10.next = 48;
          break;

        case 18:
          if (!/\.wxml/.test(file)) {
            _context10.next = 40;
            break;
          }

          _context10.next = 21;
          return [loadConfig(), util.exists(file)];

        case 21:
          _ref5 = _context10.sent;
          _ref6 = (0, _slicedToArray3.default)(_ref5, 2);
          config = _ref6[0];
          exists = _ref6[1];

          if (exists) {
            _context10.next = 28;
            break;
          }

          this.status = 404;
          throw new Error('File: ' + file + ' not found');

        case 28:
          if (!(config.pages.indexOf(file.replace(/\.wxml/, '')) == -1)) {
            _context10.next = 30;
            break;
          }

          throw new Error('File: ' + file + ' not found in pages of app.json');

        case 30:
          _context10.next = 32;
          return [loadFile(file), util.loadTemplate('view')];

        case 32:
          _ref7 = _context10.sent;
          _ref8 = (0, _slicedToArray3.default)(_ref7, 2);
          _content2 = _ref8[0];
          viewFn = _ref8[1];

          this.body = viewFn({
            width: this.query.w,
            ratio: this.query.r,
            version: version,
            inject_js: _content2,
            path: file.replace(/\.wxml/, '')
          }, {}, escape);
          this.type = 'html';
          _context10.next = 48;
          break;

        case 40:
          // support resource files with relative p
          _exists = util.exists(file);

          if (!_exists) {
            _context10.next = 46;
            break;
          }

          _context10.next = 44;
          return send(this, file);

        case 44:
          _context10.next = 48;
          break;

        case 46:
          this.status = 404;
          throw new Error('File: ' + file + ' not found');

        case 48:
          this.set('Cache-Control', 'max-age=0');

        case 49:
        case 'end':
          return _context10.stop();
      }
    }
  }, _callee10, this);
}));

router.post('/upload', _regenerator2.default.mark(function _callee11() {
  var form, file, file_path;
  return _regenerator2.default.wrap(function _callee11$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          _context11.next = 2;
          return formidable.parse({
            uploadDir: tmpDir,
            keepExtensions: true
          }, this);

        case 2:
          form = _context11.sent;
          file = form.files.file;
          file_path = path.normalize(file.path);

          this.body = { file_path: file_path };
          this.type = 'json';

        case 7:
        case 'end':
          return _context11.stop();
      }
    }
  }, _callee11, this);
}));

module.exports = router;
//# sourceMappingURL=router.js.map
