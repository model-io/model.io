// we currently don't need uuid generation in frontend so we have to stub it.
var uuid = {};
uuid.v1 = uuid.v4 = function() {};

var models = {
  onReady: new signals.Signal()
};

(function() {
  var baseCh = new Channel(new SockJS('/ws'), 'model.io');

  // Create basic channel to recive models
  var modelCh = baseCh.sub('model');
  modelCh.onData.addOnce(function(data) {
    data.forEach(function(model) {
      models._add(model);
    });
    models.onReady.dispatch(models);
  });

  models._add = function(options) {
    var Super = models[options.superClassName] || Object;
    models[options.name] = P(Super, function Model($model, $super, $class, $superClass) {
      $class.ch = modelCh.sub(options.name);
      for(var methodName in options.instanceMethods) {
        $model[methodName] = buildFunc(this, options.instanceMethods[methodName], $super);
      }
      for(var methodName in options.classMethods) {
        $class[methodName] = buildFunc(this, options.classMethods[methodName], $superClass, '$superClass');
      }
      for(var propertyName in options.classProperties) {
        $class[propertyName] = options.classProperties[propertyName];
      }
      var methodName;
      for(var i in options.instanceProxies) {
        methodName = options.instanceProxies[i];
        $model[methodName] = buildProxy(methodName, $class.ch.sub('instanceProxy'));
      }
      for(var i in options.classProxies) {
        methodName = options.classProxies[i];
        $class[methodName] = buildProxy(methodName, $class.ch.sub('classProxy'));
      }
      var signalCh = $class.ch.sub('signal');
      for(var i in options.classSignals) {
        var signal = new signals();
        var signalName = options.classSignals[i];
        var ch = signalCh.sub(signalName);
        var send = function() {
          var args = Array.prototype.slice.call(arguments, 0);
          ch.write(args);
        };
        signal.add(send);
        ch.onData.add(function(data) {
          signal.remove(send);
          signal.dispatch.apply(signal, instantiate(data));
          signal.add(send);
        })
        $class[signalName] = signal;
      }
    });
  };

  function buildFunc(thisPointer, code, $super, superVarName) {
    return Function(superVarName || '$super', 'return ' + code).call(thisPointer, $super);
  }

  function buildProxy(name, channel) {
    return function() {
      var proxyCh = channel.sub(name);
      var args = Array.prototype.slice.call(arguments, 0);
      var done = args.pop();
      proxyCh.onData.addOnce(function(data) {
        done(data.err, instantiate(data.res));
      });
      // TODO Check, whats inside `data` when calling a class proxy
      // Maybe we should change handling here or build an own channel for class proxies
      proxyCh.write({data: this, args: args});
    }
  }

  function instantiate(thing, instances) {
    instances = instances || {};
    switch(typeof(thing)) {
      case 'object':
        if(thing._type && models[thing._type]) {
          thing = instances[thing._id] = instances[thing._id] || _.extend(new models[thing._type](thing, thing._id), thing);
        }
        //fall throught
      case 'array':
        // TODO Test if this recusion really works - doubt it
        for(var key in thing) {
          thing[key] = instantiate(thing[key], instances);
        }
    }
    return thing;
  }
})();
