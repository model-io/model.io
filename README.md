model.io
========

client-server models with automatic syncronisation of code and data.

What?
-----

Holding fronend and backend models in sync has allways be difficult. In the first place we didn't have models in the fronend, than we have some but didn't talk the same language (javascript vs. X). Now with node we also solved this issue, but we still not have a perfect and lightweigt solution for this problem (at least none of which we know of). Sure, there is [derby.js](http://derbyjs.com/) and there is [meteor.js](https://www.meteor.com), but these are pretty opiniated frameworks, which force you to follow their patterns.

model.io tries to be a thin layer between frontend and backend by only sharing models and data. This is done throught websockets bases on [sock.js](http://sockjs.org) and a small multi-channel-layer [shoe.js](https://github.com/model-io/shoe.js).

State
-----

Currently model.io is in an early state, way far away to be used anywhere. You can play with it or help us out and contribute.

Whats already working:

* Setup of socket communication
* pushing of model configuraiton (mostly class and instance methods) throught the socket
* Allow running a `find`-Operation throught the websocket.
* Auto-Rebuild inheritance chain of backend in frontend using prototype inheritance (with minimal syntactic sugar of [p.js](https://github.com/jayferd/pjs))
* Test suite using [zombie.js](http://zombie.labnotes.org/)
* Allow to add instance and "class" methods with differnt types
  * **public**: method is available in front- and backend
  * **proxy**: method is available in front- and backend, but will be evaluated in backend and must therefore be asyncron. Request and result is transfered over websocket.
  * **private**: method is only available in backend
* use uuid to track instances
* pub/sub on collection events

Usage
-----

If you are using express, you may start with something like this:
```
//index.js
var express = require('express');

var app = express();

app.set('views', __dirname);
app.set('view engine', 'jade');

app.get('/', function(req, res) {
  res.render('index');
});
```

First you need to add some frontend javascript to you application. Given you installed model.io via npm and your express file lives in the same folder as the `node-modules` folder, you can e. G. add a route to the model.io files like this:
```
//register client js
app.use(express.static(__dirname + '/node_modules/model-io/client/'));
```

In your header you have to add a few files:

```
//index.jade
html
  head
    script(src='lib/lodash.custom.js')
    script(src='lib/p.js')
    script(src='lib/signals.js')
    script(src='lib/sock.js')
    script(src='lib/multiplex_client.js')
    script(src='models.js')
```

Note: These files are not minified by default. We leave this for you to decides, since noadays everyone has it's own opinions about this.

Now you can build your models. In the first place we use p.js as a super tiny wrapper around prototype inheritance. We plan to make this pluggable, if you want to use another inheritance library.

```
  models = {
    Dog: p(function($model, $super, $class, $superclass) {
      $model.init = function(data) {
        _.extend(this, data);
      };

      function bark(sound) {
        return this.name + ' says: ' + sound || 'wufff!';
      }

      $model.bark = bark;
      $model.bark.type = serverIO.TYPE_PUBLIC;
    })
  }
```
This model is the most simplest thing of model.io: A public method that is available in front and backend (`dog.bark()`)
**model.io** has much more to offer: private methods, that are only available in backend and proxy methods that are available in both front and backed but are computed in backend only. Call and result is transfered over websocket communication. Also you can created methods on "classes" direcly (e. G. *finders*). Also you can use inheritance to abstract common things away. If you want to see all this in action, refert to the test suite.

Last step is to attach he socket-server to your express server:
```
serverIO(app, models).listen(3000);
```

Now you can use your model in frond and backend:

```
var dolly = new models.Dog({name: 'Dolly'});
expect(dolly.bark('wrrrrrrrwaf')).to.be('Dolly says: wrrrrrrrwaf');
```

Roadmap
-------

* Adapterstyle abstraction for inheritance
* Pub/sub on model events
* pub/sub on "class" propery changes
* return promises when calling proxies
* middleware plugin architecture
* auto sync models
* using local storage for caching model code
* using local storage for caching data
* Monk plugin
* Angular plugin
* REST-Api plugin
* Client side model setup throught dynamic js file instead of socket connection (for caching and minification) as configuration option
* Check security
* Validation
