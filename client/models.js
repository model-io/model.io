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
    // wait for next tick so subchannels are established
    setTimeout(function() {
      models.onReady.dispatch(models);
    }, 0);
  }

  models._add = function(options) {
    models[options.name] = P(BaseModel, function Model($model, $super, $class, $superclass) {
      $model.init = function(data) {
        $super.init.call(this, data);
      }
      for(methodName in options.methods) {
        $model[methodName] = buildFunc(this, options.methods[methodName]);
      }
      $class.ch = baseCh.channel(options.name);
    });
  };
  
  BaseModel = P(function BaseModel($model, $super, $class, $superclass) {
    $model.init = function(data) {
      extend(this, data);
    }
    $model.save = function() {
      console.log('saved');
    }
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

  function extend (target, source) {
    target = target || {};
    for (var prop in source) {
      target[prop] = source[prop];
    }
    return target;
  }

  function buildFunc(thisPointer, code) {
    return Function('return ' + code).apply(thisPointer);
  }
})();
