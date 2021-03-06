var key = {
    UP:    38,
    DOWN:  40,
    LEFT:  37,
    RIGHT: 39,
    SPACE: 32
};
var pause = false;
var preload = null;
var stage = null, map = null, plane = null, mask = null, compass = null;
var fuelDisplay = null, fuelAmount = null, fuelHeight = 200;

var fps = 35;
var mapWidth = 640, mapHeight = 640;
var width = 570, height = 570;
var baseMapUri = "//maps.googleapis.com/maps/api/staticmap?key=" + apiKey + "&size=" + mapWidth + "x" + mapHeight;
var mapOffset = {
    x:-35, y:-35
};
var mapType = ""; // roadmap by default

var tick = 0;
var zoom = 16;

var maxFuel = fps * 10;
var fuel = maxFuel;

var lat = null, lon = null;
var initPointerX, initPointerY, mouseMoved;

function initPlayground() {
    preload = new createjs.LoadQueue(true);
    preload.on("fileload", handleFileLoaded, this);
    preload.on("error", handleFileError, this);
    stage = new createjs.Stage("playground");
    createjs.Touch.enable(stage);

    plane = new createjs.Bitmap("assets/drone-50-41.png");
    plane.x = width/2 - 25; // width/2 - planewidth/2
    plane.y = height/2 - 20; // height/2 - planeheight/2
    stage.addChild(plane);


    // top marker for compass
    tmp = new createjs.Shape();
    tmp.graphics.beginFill("#ff0000").rect(width/2-1, 0, 3, 5);
    stage.addChild(tmp);

    createCompass();

    mask = new createjs.Shape();
    mask.graphics.beginFill("#ff0000").drawCircle(width/2, height/2, width/2+mapOffset.x);

    fuelDisplay = new createjs.Container();
    fuelDisplay.x = width;
    fuelDisplay.y = height/2-100;
    stage.addChild(fuelDisplay);
    tmp = new createjs.Shape();
    tmp.graphics.beginStroke("#aaaaaa").rect(0, 0, 25, fuelHeight+2);
    fuelDisplay.addChild(tmp);
    fuelAmount = new createjs.Shape();
    fuelAmount.graphics.beginLinearGradientFill(["#00ff00", "#ffff00", "#ff0000"], [0, 0.75, 1], 0, 0, 0, 200).rect(1, 1, 23, fuelHeight); 
    fuelDisplay.addChild(fuelAmount);

    stage.update();
    createjs.Ticker.setFPS(fps);
}

function handleMouseDown(event) {
    initPointerX = event.stageX;
    initPointerY = event.stageY;
    mouseMoved = false;
}

function handleMouseMove(event) {
    var x = event.stageX;
    var y = event.stageY;
    var dx = x - initPointerX;
    var dy = y - initPointerY;
    mouseMoved = true;

    var tresh = 40;

    if(dx > tresh) {
        rotate(5);
        initPointerX = event.stageX;
        initPointerY = event.stageY;
    } else if(dx < tresh*-1) {
        rotate(-5);
        initPointerX = event.stageX;
        initPointerY = event.stageY;
    }
    event.preventDefault();
}

function handleMouseClick(event) {
    if(mouseMoved)
        return;

    console.log("+++ fire");
}

function createCompass() {
    compass = new createjs.Container();
    compass.regX = width/2;
    compass.regY = height/2;
    compass.rotation = 0;
    compass.x = width/2;
    compass.y = height/2;
    stage.addChild(compass);

    var tmp;

    // inner ring
    tmp = new createjs.Shape();
    tmp.graphics.beginStroke("#aaaaaa").drawCircle(width/2, height/2, width/2+mapOffset.x);
    compass.addChild(tmp);

    tmp = new createjs.Text("N", "20px Arial", "#aaaaaa");
    tmp.rotation = 0;
    tmp.x = width/2;
    tmp.y = 10;
    compass.addChild(tmp);
    tmp = new createjs.Text("E", "20px Arial", "#aaaaaa");
    tmp.x = width - 10;
    tmp.y = height/2;
    tmp.rotation = 90;
    compass.addChild(tmp);
    tmp = new createjs.Text("S", "20px Arial", "#aaaaaa");
    tmp.x = width/2;
    tmp.y = height - 10;
    tmp.rotation = 180;
    compass.addChild(tmp);
    tmp = new createjs.Text("W", "20px Arial", "#aaaaaa");
    tmp.x = 10;
    tmp.y = height/2;
    tmp.rotation = 270;
    compass.addChild(tmp);

    var segments = 72;
    for(var i = 0; i < segments; ++i) {
        var angle = i*360/segments;
        var color = "#dddddd";
        if(i % 6 == 0) {
            color = "#aaaaaa";
        }

        tmp = new createjs.Shape();
        // TODO: doesn't work?
        //tmp.graphics.moveTo(width/2, height/2).setStrokeStyle(1)
        //    .beginStroke("#ff0000").lineTo(width/2, 0);
        tmp.graphics.setStrokeStyle(1).beginStroke(color)
            .rect(width/2, height/2, 0, height/2 - 5);
        tmp.regX = tmp.x = width/2;
        tmp.regY = tmp.y = height/2;
        tmp.rotation = angle;
        compass.addChild(tmp);
    }

    // mask out inner segment lines
    tmp = new createjs.Shape();
    tmp.graphics.beginFill("#ff0000").drawRect(0, 0, width, height)
        .arc(width/2, height/2, width/2+mapOffset.x - 1, 0, Math.PI*2, true);
    compass.mask = tmp;

    // outer ring
    tmp = new createjs.Shape();
    tmp.graphics.beginStroke("#aaaaaa").drawCircle(width/2, height/2, width/2 - 5);
    compass.addChild(tmp);
}

function handleTick() {
    tick++;
    if(tick % fps == 0) {
        tick = 1;
        lon = Math.round(lon * 100000) / 100000;
        lat = Math.round(lat * 100000) / 100000;
        var mapUri = baseMapUri + "&center=" + lat + "," + lon + "&zoom=" + zoom + mapType;
        //console.log(mapUri);
        preload.loadFile({id:"map", src:mapUri, type:createjs.AbstractLoader.IMAGE});
    } 
    if(map) {
        map.y += 1;

        var deg = map.rotation;
        var dx = Math.sin(deg/180*Math.PI) * -2;
        var dy = Math.cos(deg/180*Math.PI);

        // we move 35px per sec to y (one per tick), 
        // which is 0.00050deg on zoom level 16
        // TODO: calculate dynamically to allow zoom?
        var mapFactorY = 0.000014285714285714285; // 0.00050/35
        var mapFactorX = 0.00001075;

        lon += (dx * mapFactorX);
        lat += (dy * mapFactorY);

        fuel--;
        var tmp = new createjs.Shape();
        var y = Math.round(fuelHeight - fuelHeight/maxFuel*fuel);
        tmp.graphics.beginFill("#ff0000").rect(0, y, 24, fuelHeight);
        fuelAmount.mask = tmp;

        /*
        // TODO: add to array of items in a separate container,
        // and on each tick move all items, then rotate and display

        tmp = new createjs.Bitmap("assets/fuelcan-20-20.png");
        tmp.x = width/2 - 10; // width/2 - planewidth/2
        tmp.y = 50; // height/2 - planeheight/2
        stage.addChild(tmp);
        */


    }

    stage.update();

}

function handleFileLoaded(event) {
    var item = event.item;
    if(item.id === "map" && item.type == createjs.LoadQueue.IMAGE) {
        var oldRotation = 0;
        if(map) {
            oldRotation = map.rotation;
            stage.removeChild(map);
        }
        map = new createjs.Bitmap(event.result);
        map.mask = mask;
        map.regX = mapWidth/2;
        map.regY = mapHeight/2;
        map.rotation = oldRotation;
        map.x = mapWidth/2 + mapOffset.x;
        map.y = mapHeight/2 + mapOffset.y;
        map.addEventListener("mousedown", handleMouseDown);
        map.addEventListener("pressmove", handleMouseMove);
        map.addEventListener("click", handleMouseClick);
        stage.addChildAt(map, stage.getChildIndex(plane));
    }
}

function handleFileError(event) {
    console.log("+++ file load error", event);
}

function rotate(deg) {
    if(!map) {
        return;
    }

    map.rotation = (map.rotation % 360) + deg;
    compass.rotation = (compass.rotation % 360) + deg;
}

function setCurrentPosition(longitude, latitude) {
    lon = longitude;
    lat = latitude;
    createjs.Ticker.addEventListener("tick", handleTick);
}

$(document).ready(function() {
    if(navigator.geolocation) {
        setTimeout(function() {
            if(lon !== null)
                return;
            setCurrentPosition(defaultLon, defaultLat);
        }, 10000);
        navigator.geolocation.getCurrentPosition(function(position) {
            if(lon !== null)
                return;
            setCurrentPosition(position.coords.longitude, position.coords.latitude);
        }, function(error) {
            setCurrentPosition(defaultLon, defaultLat);
        }, {
            maximumAge:Infinity, timeout:20000
        });
    } else {
        setCurrentPosition(defaultLon, defaultLat);
    }

    initPlayground();

    $(document).keydown(function(event) {
        switch(event.which) {
            case key.UP:
                event.preventDefault();
                break;
            case key.DOWN:
                event.preventDefault();
                break;
            case key.LEFT:
                rotate(5);
                event.preventDefault();
                break;
            case key.RIGHT:
                rotate(-5);
                event.preventDefault();
                break;
            case key.SPACE:
                event.preventDefault();
                break;
        }
    });

    $("#btnPause").click(function() {
        if(pause) {
            createjs.Ticker.addEventListener("tick", handleTick);
            $(this).text("Pause");
        } else {
            createjs.Ticker.removeEventListener("tick", handleTick);
            $(this).text("Resume");
        }
        pause = !pause;
        console.log("pause=" + pause);
    });

    $("#btnSatellite").click(function() {
        if(mapType.length) {
            mapType = "";
            $(this).text("Satellite");
        } else {
            mapType = "&maptype=hybrid";
            $(this).text("Map");
        }
    });
});
