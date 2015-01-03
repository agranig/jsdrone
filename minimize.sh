#!/bin/sh

JS_OUT=bomber-min.js
HTML_OUT=bomber.html

UGLIFY=$(which uglifyjs)
if [ -z "$UGLIFY" ]; then
    echo "uglifyjs not found in PATH, install from https://github.com/mishoo/UglifyJS";
    exit 1;
fi
$UGLIFY -mt bomber.js > $JS_OUT

cp index.html $HTML_OUT
perl -pi -e 's/bomber\.js/bomber-min.js/g' $HTML_OUT

