var models;

(function() {
    models = {
      <% _.each(models, function(model) { %>
        <%= model.modelName %>: function() {},
      <% }); %>
    };

    // We use simple prototype inherence here
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_Revisited

    function BaseModel() {
    }

    BaseModel.prototype = {
        test: function() {
            console.log('test');
        }
    }

    for(name in models) {
        models[name].prototype = Object.create(BaseModel.prototype)
    };
})();
