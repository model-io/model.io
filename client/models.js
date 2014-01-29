var models = {};

(function() {
  var sock = new SockJS('/ws');
  function send(method, data, done) {
    sock.onmessage = function(e) {
      done(JSON.parse(e.data));
    };
    sock.onopen = function() {
      sock.send(JSON.stringify({method: method, data: data}));
    };
  }

  sock.onclose = function() {
    console.log('close');
  };

  models._add = function(name, options) {
    models[name] = function Model(data) {
      BaseModel.call(this, data);
    }
    models[name].name = name;
    models[name].prototype = Object.create(BaseModel.prototype);
    models[name].__t = name;
    extend(models[name], BaseModel);
  }
  
  // We use simple prototype inherence here
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_Revisited

  function BaseModel(data) {
    extend(this, data);
  }

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

  BaseModel.prototype = {
    save: function(done) {
    }
  }

  function extend (target, source) {
    target = target || {};
    for (var prop in source) {
      target[prop] = source[prop];
    }
    return target;
  }
})();

<% _.each(models, function(model) { %>
  models._add('<%= model.modelName %>');
<% }); %>
