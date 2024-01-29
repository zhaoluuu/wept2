'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var parseUrl = require('url').parse;
var http = require('http');
var https = require('https');
var assign = require('object-assign');
var tunnel = require('tunnel');
var config = require('./config');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

module.exports = _regenerator2.default.mark(function _callee(context, remote) {
  var url, conf, headers, urlObj, port, isHttps, requestClient, timeout, opt, proxyMethod, req, res, name;
  return _regenerator2.default.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          url = remote || context.request.header['x-remote'] || context.request.query.url;

          if (url) {
            _context.next = 3;
            break;
          }

          throw new Error('Unknown remote url for ' + context.request.url);

        case 3:
          _context.next = 5;
          return config();

        case 5:
          conf = _context.sent;
          headers = assign({}, context.header, conf.headers);

          delete headers['x-remote'];
          delete headers['host'];
          urlObj = parseUrl(url);
          port = urlObj.port || (urlObj.protocol == 'https:' ? 443 : 80);
          isHttps = /^https/.test(urlObj.protocol);
          requestClient = isHttps ? https : http;
          timeout = conf.networkTimeout ? conf.networkTimeout.request : 30000;

          timeout = timeout || 30000;
          headers['host'] = urlObj.hostname;
          opt = {
            path: urlObj.path,
            protocol: urlObj.protocol,
            host: urlObj.hostname,
            hostname: urlObj.hostname,
            port: port,
            method: context.method.toUpperCase(),
            headers: headers,
            timeout: timeout
          };

          if (conf.proxy) {
            proxyMethod = isHttps ? 'httpsOverHttp' : 'httpOverHttp';

            opt.agent = tunnel[proxyMethod]({ proxy: conf.proxy });
          }
          req = requestClient.request(opt);
          _context.next = 21;
          return pipeRequest(context.req, req);

        case 21:
          res = _context.sent;
          _context.t0 = _regenerator2.default.keys(res.headers);

        case 23:
          if ((_context.t1 = _context.t0()).done) {
            _context.next = 30;
            break;
          }

          name = _context.t1.value;

          if (!(name === 'transfer-encoding')) {
            _context.next = 27;
            break;
          }

          return _context.abrupt('continue', 23);

        case 27:
          context.set(name, res.headers[name]);
          _context.next = 23;
          break;

        case 30:
          context.status = res.statusCode;
          context.body = res;

        case 32:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, this);
});

function pipeRequest(readable, request) {
  return function (cb) {
    readable.on('data', function (buf) {
      request.write(buf);
    });
    readable.on('end', function (buf) {
      request.end(buf);
    });
    readable.on('error', function (err) {
      console.error(err.stack);
      request.end();
      cb(err);
    });
    request.on('error', function (err) {
      cb(err);
    });
    request.on('response', function (res) {
      cb(null, res);
    });
  };
}
//# sourceMappingURL=proxy.js.map
