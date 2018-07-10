'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.chunkName = chunkName;
exports.optsToArray = optsToArray;
exports.endWithSlash = endWithSlash;
exports.findJSFile = findJSFile;

var _slash = require('slash2');

var _slash2 = _interopRequireDefault(_slash);

var _path = require('path');

var _fs = require('fs');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var JS_EXTNAMES = ['.js', '.jsx', '.ts', '.tsx'];

function stripFirstSlash(path) {
  if (path.charAt(0) === '/') {
    return path.slice(1);
  } else {
    return path;
  }
}

function chunkName(cwd, path) {
  return stripFirstSlash((0, _slash2.default)(path).replace((0, _slash2.default)(cwd), '')).replace(/\//g, '__');
}

function optsToArray(item) {
  if (!item) return [];
  if (Array.isArray(item)) {
    return item;
  } else {
    return [item];
  }
}

function endWithSlash(path) {
  return path.slice(-1) !== '/' ? path + '/' : path;
}

function findJSFile(baseDir, fileNameWithoutExtname) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = JS_EXTNAMES[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var extname = _step.value;

      var fileName = '' + fileNameWithoutExtname + extname;
      var absFilePath = (0, _path.join)(baseDir, fileName);
      if ((0, _fs.existsSync)(absFilePath)) {
        return absFilePath;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}