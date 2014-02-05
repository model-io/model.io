model.io
========

client-server models with automatic syncronisation of code and data.

What?
-----

Holding fronend and backend models in sync has allways be difficult. In the first place we didn't have models in the fronend, than we have some but didn't talk the same language (javascript vs. X). Now with node we also solved this issue, but we still not have a perfect and lightweigt solution for this problem (at least none of which we know of). Sure, there is [derby.js](http://derbyjs.com/) and there is [meteor.js](https://www.meteor.com), but these are pretty opiniated frameworks, which force you to follow their patterns.

model.io tries to be a thin layer between frontend and backend by only sharing models and data. This is done throught websockets bases on [sock.js](http://sockjs.org).

State
-----

Currently model.io is in an early state, way far away to be used anywhere. You can play with it or help us out and contribute.

Whats already working:

* Setup of socket communication
* pushing of model configuraiton (mostly class and instance methods) throught the socket
* Allow running a `find`-Operation throught the websocket.
* Auto-Rebuild inheritance chain of backend in frontend using prototype inheritance (with minimal syntactic sugar of [p.js](https://github.com/jayferd/pjs))
* Test suite using [zombie.js](http://zombie.labnotes.org/)


Roadmap
-------

* ~~Interagtion tests (with phantom.js)~~
* clean up repo
* allow model save
* middleware plugin architecture
* auto sync models
* Pub/sub on model events
* pub/sub on collection events
* using local storage for caching model code
* using local storage for caching data
* Monk plugin
* Angular plugin
* REST-Api plugin
* Client side model setup throught dynamic js file instead of socket connection (for caching and minification) as configuration option
