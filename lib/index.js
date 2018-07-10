'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.getModel = getModel;
exports.getGlobalModels = getGlobalModels;

exports.default = function (api) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _api$placeholder = api.placeholder,
      RENDER = _api$placeholder.RENDER,
      ROUTER_MODIFIER = _api$placeholder.ROUTER_MODIFIER,
      IMPORT = _api$placeholder.IMPORT;
  var _api$service = api.service,
      paths = _api$service.paths,
      config = _api$service.config;

  var rematchContainerPath = (0, _path.join)(paths.absTmpDirPath, 'RematchContainer.js');
  var isProduction = process.env.NODE_ENV === 'production';
  var shouldImportDynamic = isProduction && !config.disableDynamicImport;

  function getRematchJS() {
    var rematchJS = (0, _utils.findJSFile)(paths.absSrcPath, 'rematch');
    if (rematchJS) {
      return (0, _slash2.default)(rematchJS);
    }
  }

  function getModelName(model) {
    var modelArr = (0, _slash2.default)(model).split('/');
    return modelArr[modelArr.length - 1];
  }

  function exclude(models, excludes) {
    return models.filter(function (model) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = excludes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _exclude = _step.value;

          if (typeof _exclude === 'function' && _exclude(getModelName(model))) {
            return false;
          }
          if (_exclude instanceof RegExp && _exclude.test(getModelName(model))) {
            return false;
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

      return true;
    });
  }

  function getGlobalModelContent() {
    var ret = exclude(getGlobalModels(api.service, shouldImportDynamic), (0, _utils.optsToArray)(opts.exclude)).map(function (path, index, arr) {
      return ('\n    \'' + (0, _path.basename)(path, (0, _path.extname)(path)) + '\': require(\'' + path + '\').default\n  ').trim();
    });
    return '{\r\n' + ret.join(',\r\n') + '\r\n}';
  }

  function getPluginContent() {
    var pluginPaths = _globby2.default.sync('plugins/**/*.{js,ts}', {
      cwd: paths.absSrcPath
    });
    var ret = pluginPaths.map(function (path) {
      return ('\nrequire(\'../../' + path + '\').default\n  ').trim();
    });
    if (opts.immer) {
      ret.push(('\nrequire(\'' + (0, _slash2.default)(require.resolve('@rematch/immer')) + '\').default()\n      ').trim());
    }
    return '[\r\n' + ret.join(',\r\n') + '\r\n]';
  }

  api.register('generateFiles', function () {
    var tpl = (0, _path.join)(__dirname, '../template/RematchContainer.js');
    var tplContent = (0, _fs.readFileSync)(tpl, 'utf-8');
    var rematchJS = getRematchJS();
    if (rematchJS) {
      tplContent = tplContent.replace('<%= ExtendRematchConfig %>', ('\n...((require(\'' + rematchJS + '\').config || (() => ({})))()),\n        ').trim());
    }
    tplContent = tplContent.replace('<%= RegisterPlugins %>', getPluginContent()).replace('<%= RegisterModels %>', getGlobalModelContent());
    (0, _fs.writeFileSync)(rematchContainerPath, tplContent, 'utf-8');
  });

  api.register('modifyRouterFile', function (_ref) {
    var memo = _ref.memo;

    return memo.replace(IMPORT, ('\nimport * as routerRedux from \'react-router-redux\';\n' + (shouldImportDynamic ? 'const rematchDynamic = require(\'' + (0, _slash2.default)(require.resolve('./dynamic')) + '\').default;' : '') + '\n' + IMPORT + '\n      ').trim()).replace(ROUTER_MODIFIER, ('\nconst { ConnectedRouter } = routerRedux;\nRouter = ConnectedRouter;\n' + ROUTER_MODIFIER + '\n      ').trim());
  });

  if (shouldImportDynamic) {
    api.register('modifyRouteComponent', function (_ref2) {
      var memo = _ref2.memo,
          args = _ref2.args;
      var pageJSFile = args.pageJSFile,
          webpackChunkName = args.webpackChunkName;

      if (!webpackChunkName) {
        return memo;
      }

      var loading = config.loading;

      var loadingOpts = '';
      if (loading) {
        loadingOpts = 'LoadingComponent: require(\'' + (0, _slash2.default)((0, _path.join)(paths.cwd, loading)) + '\').default,';
      }
      var ret = ('\nrematchDynamic({\n  <%= MODELS %>\n  component: () => import(/* webpackChunkName: \'' + webpackChunkName + '\' */\'' + pageJSFile + '\'),\n  ' + loadingOpts + '\n})\n      ').trim();
      var models = getPageModels((0, _path.join)(paths.absTmpDirPath, pageJSFile), api.service);
      if (models && models.length) {
        ret = ret.replace('<%= MODELS %>', ('\nstore: window.g_store,\nmodels: () => [\n  ' + models.map(function (model) {
          return 'import(/* webpackChunkName: \'' + (0, _utils.chunkName)(paths.cwd, model) + '\' */\'' + model + '\')';
        }).join(',\r\n  ') + '\n],\n      ').trim());
      }
      return ret.replace('<%= MODELS %>', '');
    });
  }

  api.register('modifyEntryFile', function (_ref3) {
    var memo = _ref3.memo;

    var rematchRender = api.service.applyPlugins('modifyRematchRender', {
      initialValue: '\nReactDOM.render(React.createElement(\n  RematchContainer,\n  null,\n  React.createElement(require(\'./router\').default)\n), document.getElementById(\'root\'));\n'.trim()
    });

    return memo.replace(RENDER, ('\nconst RematchContainer = require(\'./RematchContainer\').default;\n' + rematchRender + '\n').trim());
  });

  api.register('modifyAFWebpackOpts', function (_ref4) {
    var memo = _ref4.memo;

    memo.alias = _extends({}, memo.alias, {
      '@rematch/core': require.resolve('@rematch/core'),
      '@rematch/loading': require.resolve('@rematch/loading'),
      'path-to-regexp': require.resolve('path-to-regexp'),
      'object-assign': require.resolve('object-assign')
    }, opts.immer ? {
      immer: require.resolve('immer')
    } : {});
    return memo;
  });

  api.register('modifyPageWatchers', function (_ref5) {
    var memo = _ref5.memo;

    return [].concat(_toConsumableArray(memo), [(0, _path.join)(paths.absSrcPath, 'models'), (0, _path.join)(paths.absSrcPath, 'plugins'), (0, _path.join)(paths.absSrcPath, 'model.js'), (0, _path.join)(paths.absSrcPath, 'model.jsx'), (0, _path.join)(paths.absSrcPath, 'model.ts'), (0, _path.join)(paths.absSrcPath, 'model.tsx'), (0, _path.join)(paths.absSrcPath, 'rematch.js'), (0, _path.join)(paths.absSrcPath, 'rematch.jsx'), (0, _path.join)(paths.absSrcPath, 'rematch.ts'), (0, _path.join)(paths.absSrcPath, 'rematch.tsx')]);
  });
};

var _fs = require('fs');

var _path = require('path');

var _globby = require('globby');

var _globby2 = _interopRequireDefault(_globby);

var _lodash = require('lodash.uniq');

var _lodash2 = _interopRequireDefault(_lodash);

var _pathIsRoot = require('path-is-root');

var _pathIsRoot2 = _interopRequireDefault(_pathIsRoot);

var _slash = require('slash2');

var _slash2 = _interopRequireDefault(_slash);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function getModel(cwd, service) {
  var config = service.config;


  var modelJSPath = (0, _utils.findJSFile)(cwd, 'model');
  if (modelJSPath) {
    return [(0, _slash2.default)(modelJSPath)];
  }

  return _globby2.default.sync('./' + (config.singular ? 'model' : 'models') + '/**/*.{ts,tsx,js,jsx}', {
    cwd: cwd
  }).filter(function (p) {
    return !p.endsWith('.d.ts') && !p.endsWith('.test.js') && !p.endsWith('.test.jsx') && !p.endsWith('.test.ts') && !p.endsWith('.test.tsx');
  }).map(function (p) {
    return (0, _slash2.default)((0, _path.join)(cwd, p));
  });
}

function getModelsWithRoutes(routes, service) {
  var paths = service.paths;

  return routes.reduce(function (memo, route) {
    if (route.component) {
      return [].concat(_toConsumableArray(memo), _toConsumableArray(getPageModels((0, _path.join)(paths.cwd, route.component), service)), _toConsumableArray(route.routes ? getModelsWithRoutes(route.routes, service) : []));
    } else {
      return memo;
    }
  }, []);
}

function getPageModels(cwd, service) {
  var models = [];
  while (!isPagesPath(cwd, service) && !isSrcPath(cwd, service) && !(0, _pathIsRoot2.default)(cwd)) {
    models = models.concat(getModel(cwd, service));
    cwd = (0, _path.dirname)(cwd);
  }
  return models;
}

function isPagesPath(path, service) {
  var paths = service.paths;

  return (0, _utils.endWithSlash)((0, _slash2.default)(path)) === (0, _utils.endWithSlash)((0, _slash2.default)(paths.absPagesPath));
}

function isSrcPath(path, service) {
  var paths = service.paths;

  return (0, _utils.endWithSlash)((0, _slash2.default)(path)) === (0, _utils.endWithSlash)((0, _slash2.default)(paths.absSrcPath));
}

function getGlobalModels(service, shouldImportDynamic) {
  var paths = service.paths,
      routes = service.routes;

  var models = getModel(paths.absSrcPath, service);
  if (!shouldImportDynamic) {
    // 不做按需加载时，还需要额外载入 page 路由的 models 文件
    models = [].concat(_toConsumableArray(models), _toConsumableArray(getModelsWithRoutes(routes, service)));
    // 去重
    models = (0, _lodash2.default)(models);
  }
  return models;
}