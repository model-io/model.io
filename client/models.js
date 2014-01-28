var models = {};

(function() {

  var sock = new SockJS('/ws');
  sock.onopen = function() {
    console.log('open');
  };
  sock.onmessage = function(e) {
    console.log('message', e.data);
  };
  sock.onclose = function() {
    console.log('close');
  };

  models._add = function(name, options) {
    models[name] = function(data) {
      BaseModel.call(this, data);
    }
    models[name].prototype = Object.create(BaseModel.prototype);
    extend(models[name], BaseModel);
  }
  // We use simple prototype inherence here
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_Revisited

  function BaseModel(data) {
    extend(this, data);
  }

  BaseModel.find = function(where, options, findDone) {
    console.log(arguments);
  }

  BaseModel.prototype = {
    test: function() {
      console.log('test');
    },
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
