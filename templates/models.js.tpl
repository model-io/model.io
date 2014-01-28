var models;

(function() {
    models = {
      <% _.each(models, function(model) { %>
        <%= model.modelName %>: function() {},
      <% }); %>
    };
})();
