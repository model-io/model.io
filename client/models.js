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
      models._add(model.name, {});
    });
    models.onReady.dispatch(models);
  }

  var sock = baseCh.channel('_sock');

  function send(method, data, done) {
    sock.onmessage = function(e) {
      done(JSON.parse(e.data));
    };
    sock.send(JSON.stringify({method: method, data: data}));
  }

  sock.onclose = function() {
    console.log('close');
  };

  models._add = function(name, options) {
    var Model = P(BaseModel, function Model(model) {
    });
    Model.name = Model.__t = name;
    extend(Model, BaseModel);
    models[name] = Model;
  }
  
  BaseModel = P(function BaseModel(model) {
    model.init = function(data) {
      extend(this, data);
    }
    model.save = function() {
      console.log('saved');
    }
  });

  BaseModel.find = function(where, options, findDone) {
    send(this.__t + '.find', [where, options], function(data) {
      collection = [];
      for (var i in data) {
        var entity = data[i];
        Model = models[entity.__t];
        entity = new Model(entity);
        collection.push(entity);
      }
      findDone(collection);
    });
  }

  function extend (target, source) {
    target = target || {};
    for (var prop in source) {
      target[prop] = source[prop];
    }
    return target;
  }
})();
