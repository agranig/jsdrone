#!/bin/sh

JS_OUT=drone-min.js
HTML_OUT=drone.html

UGLIFY=$(which uglifyjs)
if [ -z "$UGLIFY" ]; then
    echo "uglifyjs not found in PATH, install from https://github.com/mishoo/UglifyJS";
    exit 1;
fi
$UGLIFY -mt drone.js > $JS_OUT

cp index.html $HTML_OUT
perl -pi -e 's/drone\.js/drone-min.js/g' $HTML_OUT

