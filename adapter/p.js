var _ = require('lodash');
var Signal = require('signals');
var ModelIOServer = require('../index');

function superClasses(model, models) {
  model.superClasses = model.superClasses || _.pick(models, function(parent) {
    return model.prototype instanceof parent;
  });
  return model.superClasses;
}

function superClassName(model, models) {
  _.each(superClasses(model, models), function(superClass, superClassName) {
    model.superClasses = _.omit(model.superClasses, _.keys(superClasses(superClass, models)));
  });
  return _.keys(model.superClasses)[0];
}

function instanceMethods(model) {
  return _(model.prototype).pick(function(method, name) {
    return model.prototype.hasOwnProperty(name) &&
           !name.match(/constructor/) &&
           (method.type === ModelIOServer.TYPE_PUBLIC || name === 'init');
  }).map(function(method, name) {
    return [name, method.toString()];
  }).object().valueOf();
}

function instanceProxies(model) {
  var proxies = _(model.prototype).pick(function(method, name) {
    return model.prototype.hasOwnProperty(name) &&
           method.type === ModelIOServer.TYPE_PROXY
  }).keys().valueOf();
  _.each(proxies, function(name) {
    var proxyCh = model.ch.sub('instanceProxy').sub(name)
    proxyCh.onData.add(function(conn, transport) {
      var args = transport.args;
      args.push(function(err, res) {
        proxyCh.write(conn, {err: err, res: res});
      });
      // TODO load 'right' instance
      // currently only the instance is extendet with this-data of frontend model
      var instance = new model();
      _.extend(instance, transport.data);
      return instance[name].apply(instance, args);
    });
  });
  return proxies;
}

function isPrimitive(thing) {
  return _.isNumber(thing) || _.isBoolean(thing) || _.isString(thing) || _.isRegExp(thing);
}

function classProperties(model) {
  return _(model).pick(function(property, name) {
    return model.hasOwnProperty(name) && (
             (_.isPlainObject(property) && property.type === ModelIOServer.TYPE_PUBLIC) ||
             isPrimitive(property)
           );
  }).map(function(property, name) {
    return [name, _.has(property, 'value') ? property.value : property];
  }).object().valueOf();
}

function classMethods(model) {
  return _(model).pick(function(method, name) {
    return model.hasOwnProperty(name) &&
           _.isFunction(method) &&
           method.type === ModelIOServer.TYPE_PUBLIC;
  }).map(function(method, name) {
    return [name, method.toString()];
  }).object().valueOf();
}

function classProxies(model) {
  var proxies =  _(model).pick(function(method, name) {
    return model.hasOwnProperty(name) &&
           _.isFunction(method) &&
           method.type === ModelIOServer.TYPE_PROXY
  }).keys().valueOf();

  _.each(proxies, function(name) {
    var proxyCh = model.ch.sub('classProxy').sub(name)
    proxyCh.onData.add(function(conn, transport) {
      var args = transport.args;
      args.push(function(err, res) {
        proxyCh.write(conn, {err: err, res: res});
      });
      return model[name].apply(model, args);
    });
  });

  return proxies;
}

function classSignals(model) {
  return _.pick(model, function(method, name) {
    return model.hasOwnProperty(name) &&
           method instanceof Signal
  });
}

module.exports = {
  superClassName: superClassName,
  instanceMethods: instanceMethods,
  instanceProxies: instanceProxies,
  classProperties: classProperties,
  classMethods:    classMethods,
  classProxies:    classProxies,
  classSignals:    classSignals
}
