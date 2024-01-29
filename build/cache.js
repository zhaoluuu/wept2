"use strict";

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var cache = {};

var wxss_map = {};

module.exports = {
  set: function set(path, str) {
    cache[path] = str;
  },
  del: function del(path) {
    delete cache[path];
  },
  get: function get(path) {
    return cache[path];
  },
  setWxssMap: function setWxssMap(files) {
    var arr = files.map(function (f) {
      return f;
    });
    wxss_map[arr.shift()] = arr;
  },
  getRelatedWxssFiles: function getRelatedWxssFiles(file) {
    file = /^\.\//.test(file) ? file : "./" + file;
    var res = [];
    (0, _keys2.default)(wxss_map).forEach(function (key) {
      var files = wxss_map[key];
      if (files.indexOf(file) !== -1) res.push(key);
    });
    return res;
  }
};
//# sourceMappingURL=cache.js.map
