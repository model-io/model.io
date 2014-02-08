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
  //FIXME channel must be created upfront, maybe a bug in WebSocketMultiplex?
  baseCh.channel('Dog');
  modelCh.onmessage = function(e) {
    _models = fromJSON(e.data);
    _models.forEach(function(model) {
      models._add(model);
    });
    // wait for next tick so subchannels are established
    setTimeout(function() {
      models.onReady.dispatch(models);
    }, 0);
  }

  models._add = function(options) {
    var Super = models[options.superClassName] || BaseModel;
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
            done(null, e.data);
          }
          $class.ch.send(toJSON([methodName, args]));
        }
      }
    });
  };
  
  var BaseModel = P(function BaseModel($model, $super, $class, $superclass) {
    $class.find = function(where, options, findDone) {
      var self = this;
      this.send('find', [where, options], function(data) {
        collection = [];
        for (var i in data) {
          var entity = data[i];
          entity = new self(entity);
          collection.push(entity);
        }
        findDone(collection);
      });
    }
    $class.send = function(method, data, sendDone) {
      this.ch.onmessage = function(e) {
        sendDone(JSON.parse(e.data));
      };
      this.ch.send(JSON.stringify({method: method, data: data}));
    }
  });

  function buildFunc(thisPointer, code, $super) {
    return Function('$super', 'return ' + code).call(thisPointer, $super);
  }
})();
