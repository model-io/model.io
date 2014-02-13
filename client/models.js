var models = {
  onReady: new signals.Signal()
};

(function() {
  var WSM = WebSocketMultiplex;
  var baseCh = new WSM(new SockJS('/ws'));
  var toJSON = JSON.stringify;
  var fromJSON = JSON.parse;

  // Create basic channel to recive models
  var modelCh = baseCh.channel('_model');
  modelCh.onmessage = function(e) {
    _models = fromJSON(e.data);
    _models.forEach(function(model) {
      models._add(model);
    });
    models.onReady.dispatch(models);
  }

  models._add = function(options) {
    var Super = models[options.superClassName] || Object;
    models[options.name] = P(Super, function Model($model, $super, $class, $superClass) {
      $class.ch = baseCh.channel(options.name);
      for(methodName in options.instanceMethods) {
        $model[methodName] = buildFunc(this, options.instanceMethods[methodName], $super);
      }
      for(methodName in options.classMethods) {
        $class[methodName] = buildFunc(this, options.classMethods[methodName], $superClass, '$superClass');
      }
      for(propertyName in options.classProperties) {
        $class[propertyName] = options.classProperties[propertyName];
      }
      var methodName;
      for(i in options.instanceProxies) {
        methodName = options.instanceProxies[i];
        $model[methodName] = buildProxy(methodName, $class.ch);
      }
      for(i in options.classProxies) {
        methodName = options.classProxies[i];
        $class[methodName] = buildProxy(methodName, $class.ch);
      }
    });
  };

  function buildFunc(thisPointer, code, $super, superVarName) {
    return Function(superVarName || '$super', 'return ' + code).call(thisPointer, $super);
  }

  function buildProxy(name, channel) {
    return function() {
      args = Array.prototype.slice.call(arguments, 0);
      done = args.pop();
      channel.onmessage = function(e) {
        e = fromJSON(e.data);
        done(e.err, instantiate(e.res));
      }
      // TODO Check, whats inside `data` when calling a class proxy
      // Maybe we should change handling here or build an own channel for class proxies
      channel.send(toJSON({name: name, data: this, args: args}));
    }
  }

  function instantiate(thing) {
    switch(typeof(thing)) {
      case 'object':
        if(thing._type && models[thing._type]) {
          thing = _.extend(new models[thing._type](), thing);
        }
        //fall throught
      case 'array':
        // TODO Test if this recusion really works - doubt it
        for(key in thing) {
          thing[key] = instantiate(thing[key]);
        }
    }
    return thing;
  }
})();
