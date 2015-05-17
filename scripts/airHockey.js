// 
//  AirHockey.js 
//  
//  Created by Philip Rosedale on January 26, 2015
//  Copyright 2015 High Fidelity, Inc.
//  
//  AirHockey table and pucks
// 
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

var debugVisible = false;

var FIELD_WIDTH = 1.21;
var FIELD_LENGTH = 1.92;
var FLOOR_THICKNESS = 0.20;
var EDGE_THICKESS = 0.10;
var EDGE_HEIGHT = 0.10;
var DROP_HEIGHT = 0.3;
var PUCK_SIZE = 0.15;
var PUCK_THICKNESS = 0.05;
var PADDLE_SIZE = 0.15;
var PADDLE_THICKNESS = 0.05;

var ENTITY_SEARCH_RANGE = 500;

var GOAL_WIDTH = 0.35;

var GRAVITY = -9.8;
var LIFETIME = 6000;
var PUCK_DAMPING = 0.02;
var PADDLE_DAMPING = 0.35;
var ANGULAR_DAMPING = 0.4;
var PADDLE_ANGULAR_DAMPING = 0.75;
var MODEL_SCALE = 1.52;
var MODEL_OFFSET = {
  x: 0,
  y: -0.19,
  z: 0
};

var LIGHT_OFFSET = {
  x: 0,
  y: 0.2,
  z: 0
};

var LIGHT_FLASH_TIME = 700;

var scoreSound = SoundCache.getSound("https://s3.amazonaws.com/hifi-public/sounds/Collisions-hitsandslaps/airhockey_score.wav");

var polyTable = "https://hifi-public.s3.amazonaws.com/ozan/props/airHockeyTable/airHockeyTableForPolyworld.fbx"
var normalTable = "https://hifi-public.s3.amazonaws.com/ozan/props/airHockeyTable/airHockeyTable.fbx"
var hitSound1 = "https://s3.amazonaws.com/hifi-public/sounds/Collisions-hitsandslaps/airhockey_hit1.wav"
var hitSound2 = "https://s3.amazonaws.com/hifi-public/sounds/Collisions-hitsandslaps/airhockey_hit2.wav"
var hitSideSound = "https://s3.amazonaws.com/hifi-public/sounds/Collisions-hitsandslaps/airhockey_hit3.wav"
var puckModel = "https://hifi-public.s3.amazonaws.com/ozan/props/airHockeyTable/airHockeyPuck.fbx"
var puckCollisionModel = "http://headache.hungry.com/~seth/hifi/airHockeyPuck-hull.obj"
var paddleModel = "https://hifi-public.s3.amazonaws.com/ozan/props/airHockeyTable/airHockeyPaddle.obj"
var paddleCollisionModel = "http://headache.hungry.com/~seth/hifi/paddle-hull.obj"

HIFI_PUBLIC_BUCKET = "http://s3.amazonaws.com/hifi-public/";
var screenSize = Controller.getViewportDimensions();
var BUTTON_SIZE = 32;
var PADDING = 3;

var center;
function offset(delta) { return Vec3.sum(center, delta); }

var edgeRestitution = 0.9;
var floorFriction = 0.01;

[hitSound1, hitSound2, hitSideSound].forEach(SoundCache.getSound); // load 'em up
// Keep track of our toys so we can clean them up.
var paddle1Pos, paddle2Pos, allOurToys = [];
function removeToy(item) {
  allOurToys = allOurToys.filter(function (toy) {
    return toy !== item;
  });
  Entities.editEntity(item, {locked: false});
  Entities.deleteEntity(item);
}
function addToy(spec) {
  var item = Entities.addEntity(spec);
  allOurToys.push(item);
  return item;
}
var isReady = false, isChecking = true;
function isKnown(toy) { return Entities.identifyEntity(toy).isKnownID; }
function checkReady() {
  isReady = allOurToys.every(isKnown);
  if (isReady) {
    isChecking = false;
  } else {
    Script.setTimeout(checkReady, 10);
  }
}
function resetReady() {
  if (isChecking) return;
  isChecking = true;
  isReady = false;
  checkReady();
}

function addOverlay(image, x) {
  return Overlays.addOverlay("image", {
    x: x,
    y: screenSize.y - (BUTTON_SIZE * 2 + PADDING),
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    imageURL: HIFI_PUBLIC_BUCKET + image,
    color: {
      red: 255,
      green: 255,
      blue: 255
    },
    alpha: 1
  });
}
  
var deleteButton = addOverlay("images/delete.png", screenSize.x / 2 - BUTTON_SIZE);
var spawnButton = addOverlay("images/puck.png", screenSize.x / 2 + PADDING);

var light;
var puck;
var paddle1, paddle2;

//  Create pucks 

function makeNewProp(which, position) {
  function add(name, visual, collision, sound, diameter, thickness, linearDamping, angularDamping, dy, position) {
    var toy = addToy({
      name: name,
      type: "Model",
      modelURL: visual,
      compoundShapeURL: collision,
      collisionSoundURL: sound,
      position: position,
      dimensions: {
	x: diameter,
	y: thickness,
	z: diameter
      },
      ignoreCollisions: false,
      damping: linearDamping,
      angularDamping: angularDamping,
      lifetime: LIFETIME,
      collisionsWillMove: true
    });
    function dropWhenKnown() {
      if (isKnown(toy)) {
	Entities.editEntity(toy, {
	  gravity: {x: 0, y: GRAVITY, z: 0},
	  velocity: {x: 0, y: dy, z: 0}
	});
      } else {
	Script.setTimeout(dropWhenKnown, 10);
      }
    }
    dropWhenKnown();
    return toy;
  }
  switch (which) {
  case "puck":
    return add("puck", puckModel, puckCollisionModel, hitSound1,
	PUCK_SIZE, PUCK_THICKNESS, PUCK_DAMPING, ANGULAR_DAMPING, 0.05, offset({x: 0, y: DROP_HEIGHT, z: 0}));
  case "paddle1":
    return add("paddle", paddleModel, paddleCollisionModel, hitSound2,
	PADDLE_SIZE, PADDLE_THICKNESS, PADDLE_DAMPING, PADDLE_ANGULAR_DAMPING, 0.07, paddle1Pos);
  case "paddle2":
    return add("paddle", paddleModel, paddleCollisionModel, hitSound2,
	PADDLE_SIZE, PADDLE_THICKNESS, PADDLE_DAMPING, PADDLE_ANGULAR_DAMPING, 0.07, paddle2Pos);
  }
}

function update(deltaTime) {
  if (!isReady) return;
  if (Math.random() < 0.1) {
    var puckProps = Entities.getEntityProperties(puck);
    var paddle1Props = Entities.getEntityProperties(paddle1);
    var paddle2Props = Entities.getEntityProperties(paddle2);
    
    if (puckProps.position.y < (center.y - DROP_HEIGHT)) {
      score();
      resetReady();
    }

    if (paddle1Props.position.y < (center.y - DROP_HEIGHT)) {
      removeToy(paddle1);
      paddle1 = makeNewProp("paddle1");
      resetReady();
    }
    if (paddle2Props.position.y < (center.y - DROP_HEIGHT)) {
      removeToy(paddle2);
      paddle2 = makeNewProp("paddle2");
      resetReady();
    }
  }
}

function score() {
  Audio.playSound(scoreSound, {
    position: center,
    volume: 1.0
  });
  puckDropPosition = Entities.getEntityProperties(puck).position;
  var newPosition;
  if (Vec3.distance(puckDropPosition, paddle1Pos) > Vec3.distance(puckDropPosition, paddle2Pos)) {
    newPosition = paddle2Pos;
  } else {
    newPosition = paddle1Pos;
  }
  Entities.editEntity(puck, {
    position: newPosition,
    velocity: {
      x: 0,
      y: 0.05,
      z: 0
    }
  });
  Entities.editEntity(light, {
    visible: true
  });
  Script.setTimeout(function() {
    Entities.editEntity(light, {
      visible: false
    });
  }, LIGHT_FLASH_TIME);
}

function mousePressEvent(event) {
  var clickedOverlay = Overlays.getOverlayAtPoint({
    x: event.x,
    y: event.y
  });
  if (clickedOverlay == spawnButton) {
    spawnAllTheThings();
  } else if (clickedOverlay == deleteButton) {
    deleteAllTheThings();
  }
}

function spawnAllTheThings() {
  center = Vec3.sum(MyAvatar.position, Vec3.multiply((FIELD_WIDTH + FIELD_LENGTH) * 0.60, Quat.getFront(Camera.getOrientation())));
  paddle1Pos = offset({
      x: 0,
      y: DROP_HEIGHT * 1.5,
      z: FIELD_LENGTH * 0.35
  });
  paddle2Pos = offset({
    x: 0,
    y: DROP_HEIGHT * 1.5,
    z: -FIELD_LENGTH * 0.35
  });
  function add(options) {
    options.type = options.type || "Box";
    options.gravity = {x: 0, y: 0, z: 0};
    options.ignorecollisions = false;
    options.locked = true;
    options.lifetime = LIFETIME,
    return addToy(options);
  }
  var grey1 = {red: 128, green: 128, blue: 128};
  var grey2 = {red: 100, green: 100, blue: 100};
  add({
    name: "floor",
    position: offset({x: 0, y: 0, z: 0}),
    dimensions: {
      x: FIELD_WIDTH,
      y: FLOOR_THICKNESS,
      z: FIELD_LENGTH
    },
    color: grey1,
    friction: floorFriction,
    visible: debugVisible,
  });
  function addEdge(position, dimensions) {
    add({
      name: 'edge',
      collisionSoundURL: hitSideSound,
      position: position,
      dimensions: dimensions,
      color: grey2,
      visible: debugVisible,
      restitution: edgeRestitution
    });
  }
  addEdge(offset({
    x: FIELD_WIDTH / 2.0,
    y: FLOOR_THICKNESS / 2.0,
    z: 0
  }), {
    x: EDGE_THICKESS,
    y: EDGE_HEIGHT,
    z: FIELD_LENGTH + EDGE_THICKESS
  });
  addEdge(offset({
      x: -FIELD_WIDTH / 2.0,
      y: FLOOR_THICKNESS / 2.0,
      z: 0
    }), {
      x: EDGE_THICKESS,
      y: EDGE_HEIGHT,
      z: FIELD_LENGTH + EDGE_THICKESS
    });
  addEdge(offset({
      x: FIELD_WIDTH / 4.0 + (GOAL_WIDTH / 4.0),
      y: FLOOR_THICKNESS / 2.0,
      z: -FIELD_LENGTH / 2.0
    }), {
      x: FIELD_WIDTH / 2.0 - GOAL_WIDTH / 2.0,
      y: EDGE_HEIGHT,
      z: EDGE_THICKESS
    });
  addEdge(offset({
      x: -FIELD_WIDTH / 4.0 - (GOAL_WIDTH / 4.0),
      y: FLOOR_THICKNESS / 2.0,
      z: -FIELD_LENGTH / 2.0
    }), {
      x: FIELD_WIDTH / 2.0 - GOAL_WIDTH / 2.0,
      y: EDGE_HEIGHT,
      z: EDGE_THICKESS
    });
  addEdge(offset({
      x: FIELD_WIDTH / 4.0 + (GOAL_WIDTH / 4.0),
      y: FLOOR_THICKNESS / 2.0,
      z: FIELD_LENGTH / 2.0
    }), {
      x: FIELD_WIDTH / 2.0 - GOAL_WIDTH / 2.0,
      y: EDGE_HEIGHT,
      z: EDGE_THICKESS
    });
  addEdge(offset({
    x: -FIELD_WIDTH / 4.0 - (GOAL_WIDTH / 4.0),
    y: FLOOR_THICKNESS / 2.0,
    z: FIELD_LENGTH / 2.0
  }), {
    x: FIELD_WIDTH / 2.0 - GOAL_WIDTH / 2.0,
    y: EDGE_HEIGHT,
    z: EDGE_THICKESS
  });
  add({
    name: "table",
    type: "Model",
    modelURL: polyTable,
    dimensions: Vec3.multiply({
      x: 0.8,
      y: 0.45,
      z: 1.31
    }, MODEL_SCALE),
    position: offset(MODEL_OFFSET),
    visible: true
  });
  light = addToy({
    name: "hockeyLight",
    type: "Light",
    dimensions: {
      x: 5,
      y: 5,
      z: 5
    },
    position: offset(LIGHT_OFFSET),
    intensity: 5,
    color: {
      red: 200,
      green: 20,
      blue: 200
    },
    visible: false
  });
  puck = makeNewProp("puck");
  paddle1 = makeNewProp("paddle1");
  paddle2 = makeNewProp("paddle2");

  Script.update.connect(update);
  checkReady();
}

function deleteAllTheThings() {
  Script.update.disconnect(update);
  [].concat(allOurToys).forEach(removeToy)
}

function scriptEnding() {

  Overlays.deleteOverlay(spawnButton);
  Overlays.deleteOverlay(deleteButton);
  deleteAllTheThings();
}

Controller.mousePressEvent.connect(mousePressEvent);
Script.scriptEnding.connect(scriptEnding);
