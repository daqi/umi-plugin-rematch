'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = dynamic;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var cached = {};
function registerModel(store, model) {
  model = model.default || model;
  if (!cached[model.name]) {
    store.model(model);
    cached[model.name] = 1;
  }
}

var defaultLoadingComponent = function defaultLoadingComponent() {
  return null;
};

function asyncComponent(config) {
  var resolve = config.resolve;


  return function (_Component) {
    _inherits(DynamicComponent, _Component);

    function DynamicComponent() {
      var _ref;

      _classCallCheck(this, DynamicComponent);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var _this = _possibleConstructorReturn(this, (_ref = DynamicComponent.__proto__ || Object.getPrototypeOf(DynamicComponent)).call.apply(_ref, [this].concat(args)));

      _this.LoadingComponent = config.LoadingComponent || defaultLoadingComponent;
      _this.state = {
        AsyncComponent: null
      };
      _this.load();
      return _this;
    }

    _createClass(DynamicComponent, [{
      key: 'componentDidMount',
      value: function componentDidMount() {
        this.mounted = true;
      }
    }, {
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        this.mounted = false;
      }
    }, {
      key: 'load',
      value: function load() {
        var _this2 = this;

        resolve().then(function (m) {
          var AsyncComponent = m.default || m;
          if (_this2.mounted) {
            _this2.setState({ AsyncComponent: AsyncComponent });
          } else {
            _this2.state.AsyncComponent = AsyncComponent; // eslint-disable-line
          }
        });
      }
    }, {
      key: 'render',
      value: function render() {
        var AsyncComponent = this.state.AsyncComponent;
        var LoadingComponent = this.LoadingComponent;

        if (AsyncComponent) return _react2.default.createElement(AsyncComponent, this.props);

        return _react2.default.createElement(LoadingComponent, this.props);
      }
    }]);

    return DynamicComponent;
  }(_react.Component);
}

function dynamic(config) {
  var store = config.store,
      resolveModels = config.models,
      resolveComponent = config.component;

  return asyncComponent(_extends({
    resolve: config.resolve || function () {
      var models = typeof resolveModels === 'function' ? resolveModels() : [];
      var component = resolveComponent();
      return new Promise(function (resolve) {
        Promise.all([].concat(_toConsumableArray(models), [component])).then(function (ret) {
          if (!models || !models.length) {
            return resolve(ret[0]);
          } else {
            var len = models.length;
            ret.slice(0, len).forEach(function (m) {
              m = m.default || m;
              if (!Array.isArray(m)) {
                m = [m];
              }
              m.map(function (_) {
                return registerModel(store, _);
              });
            });
            resolve(ret[len]);
          }
        });
      });
    }
  }, config));
}

dynamic.setDefaultLoadingComponent = function (LoadingComponent) {
  defaultLoadingComponent = LoadingComponent;
};