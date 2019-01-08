= JSDrone

== About

JSDrone is a tiny and simple JS implementation of a game to explore your area
via Google Maps using a drone in top-down view.

![Map View](https://raw.githubusercontent.com/agranig/jsdrone/master/assets/screen-map.png)

![Satellite View](https://raw.githubusercontent.com/agranig/jsdrone/master/assets/screen-sat.png)

The idea was to create a full game out of it, requiting you to pick up fuel crates and such (this is
why there is a preliminary fuel indication in the current implementation). I abandoned any work on
this though due to having lost interest.

== Install

Copy config.js.example to config.js and put your Google Maps Static API Key there. There is no support for
signed URLs, so make sure to disable URL signing in the Google Cloud Platform console for this API.

Then run on any web server.
