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
    models[options.name] = P(Super, function Model($model, $super, $class, $superclass) {
      $class.ch = baseCh.channel(options.name);
      for(methodName in options.instanceMethods) {
        $model[methodName] = buildFunc(this, options.instanceMethods[methodName], $super);
      }
      var methodName;
      for(i in options.instanceProxies) {
        methodName = options.instanceProxies[i]; 
        $model[methodName] = function() {
          args = Array.prototype.slice.call(arguments, 0);
          done = args.pop();
          $class.ch.onmessage = function(e) {
            e = fromJSON(e.data);
            done(e.err, e.res);
          }
          $class.ch.send(toJSON([methodName, args]));
        }
      }
    });
  };
  function buildFunc(thisPointer, code, $super) {
    return Function('$super', 'return ' + code).call(thisPointer, $super);
  }
})();
