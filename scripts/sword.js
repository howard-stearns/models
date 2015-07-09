//  stick.js
//  examples
//
//  Created by Seth Alves on 2015-6-10
//  Copyright 2015 High Fidelity, Inc.
//
//  Allow avatar to hold a stick
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
"use strict";
/*jslint vars: true*/
var Script, Entities, MyAvatar, Window, Overlays, Controller, Vec3, Quat, print, ToolBar, Settings; // Referenced globals provided by High Fidelity.
Script.include("http://s3.amazonaws.com/hifi-public/scripts/libraries/toolBars.js");

var hand = Settings.getValue("highfidelity.sword.hand", "right");
var nullActionID = "00000000-0000-0000-0000-000000000000";
var controllerID;
var controllerActive;
var stickID = null;
var actionID = nullActionID;
var targetIDs = [];
var dimensions = { x: 0.3, y: 0.1, z: 2.0 };
var AWAY_ORIENTATION =  Quat.fromPitchYawRollDegrees(-90, 0, 0);
var BUTTON_SIZE = 32;

var stickModel = "https://hifi-public.s3.amazonaws.com/eric/models/stick.fbx";
var swordModel = "https://hifi-public.s3.amazonaws.com/ozan/props/sword/sword.fbx";
var whichModel = "sword";
var attachmentOffset; // A fudge when using mouse rather than hand-controller, to hit yourself less often.
var RIGHT_MOUSE_CONTROLLER_OFFSET = {x: 0.5, y: 0.4, z: 0.0}, LEFT_MOUSE_CONTROLLER_OFFSET = {x: -0.5, y: 0.4, z: 0.0}; 

var toolBar = new ToolBar(0, 0, ToolBar.vertical, "highfidelity.sword.toolbar", function () {
    return {x: 100, y: 380};
});

var SWORD_IMAGE = "http://s3.amazonaws.com/hifi-public/images/billiardsReticle.png";  // Toggle between brandishing/sheathing sword (creating if necessary)
var TARGET_IMAGE = "http://s3.amazonaws.com/hifi-public/images/puck.png"; // Create a target dummy
var CLEANUP_IMAGE = "http://s3.amazonaws.com/hifi-public/images/delete.png"; // Remove sword and all target dummies.f
var SWITCH_HANDS_IMAGE = "http://s3.amazonaws.com/hifi-public/images/up-arrow.svg"; // Toggle left vs right hand. Persists in settings.
var swordButton = toolBar.addOverlay("image", {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    imageURL: SWORD_IMAGE,
    alpha: 1
});
var targetButton = toolBar.addOverlay("image", {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    imageURL: TARGET_IMAGE,
    alpha: 1
});
var switchHandsButton = toolBar.addOverlay("image", {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    imageURL: SWITCH_HANDS_IMAGE,
    alpha: 1
});
var cleanupButton = toolBar.addOverlay("image", {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    imageURL: CLEANUP_IMAGE,
    alpha: 1
});

var flasher;
function clearFlash() {
    if (!flasher) {
        return;
    }
    Script.clearTimeout(flasher.timer);
    Overlays.deleteOverlay(flasher.overlay);
    flasher = null;
}
function flash(color) {
    clearFlash();
    flasher = {};
    flasher.overlay = Overlays.addOverlay("text", {
        backgroundColor: color,
        backgroundAlpha: 0.7,
        width: Window.innerWidth,
        height: Window.innerHeight
    });
    flasher.timer = Script.setTimeout(clearFlash, 500);
}


var health = 100;
var display;
var isAway = false;
function updateDisplay() {
    var text = health.toString();
    if (!display) {
        health = 100;
        display = Overlays.addOverlay("text", {
            text: text,
            font: { size: 20 },
            color: {red: 0, green: 255, blue: 0},
            backgroundColor: {red: 100, green: 100, blue: 100}, // Why doesn't this and the next work?
            backgroundAlpha: 0.9,
            x: Window.innerWidth - 50,
            y: 50
        });
    } else {
        Overlays.editOverlay(display, {text: text});
    }
}
function removeDisplay() {
    if (display) {
        Overlays.deleteOverlay(display);
        display = null;
    }
}

function cleanUp(leaveButtons) {
    attachmentOffset = {x: 0, y: 0, z: 0};
    if (stickID) {
        Entities.deleteAction(stickID, actionID);
        Entities.deleteEntity(stickID);
        stickID = null;
        actionID = nullActionID;
    }
    targetIDs.forEach(function (id) {
        Entities.deleteAction(id.entity, id.action);
        Entities.deleteEntity(id.entity);
    });
    targetIDs = [];
    removeDisplay();
    isAway = false;
    if (!leaveButtons) {
        toolBar.cleanup();
    }
}

function computeEnergy(collision, entityID) {
    var id = entityID || collision.idA || collision.idB;
    var entity = id && Entities.getEntityProperties(id);
    var mass = entity ? (entity.density * entity.dimensions.x * entity.dimensions.y * entity.dimensions.z) : 1;
    var linearVelocityChange = Vec3.length(collision.velocityChange);
    var energy = 0.5 * mass * linearVelocityChange * linearVelocityChange;
    return Math.min(Math.max(1.0, Math.round(energy)), 20);
}
function gotHit(collision) {
    if (isAway) { return; }
    var energy = computeEnergy(collision);
    health -= energy;
    flash({red: 255, green: 0, blue: 0});
    updateDisplay();
}
function scoreHit(idA, idB, collision) {
    if (isAway) { return; }
    var energy = computeEnergy(collision, idA);
    health += energy;
    flash({red: 0, green: 255, blue: 0});
    updateDisplay();
}

function positionStick(stickOrientation) {
    var baseOffset = Vec3.sum(attachmentOffset, {x: 0.0, y: 0.0, z: -dimensions.z / 2});
    var offset = Vec3.multiplyQbyV(stickOrientation, baseOffset);
    Entities.updateAction(stickID, actionID, {relativePosition: offset,
                                              relativeRotation: stickOrientation});
}

function isFighting() {
    return stickID && (actionID !== nullActionID) && !isAway;
}

function initControls() {
    print("Sword hand is " + hand);
    if (hand === "right") {
        controllerID = 3; // right handed
    } else {
        controllerID = 4; // left handed
    }
}

function mouseMoveEvent(event) {
    if (controllerActive || !isFighting()) {
        return;
    }
    attachmentOffset = (hand === 'left') ? LEFT_MOUSE_CONTROLLER_OFFSET : RIGHT_MOUSE_CONTROLLER_OFFSET;
    var windowCenterX = Window.innerWidth / 2;
    var windowCenterY = Window.innerHeight / 2;
    var mouseXCenterOffset = event.x - windowCenterX;
    var mouseYCenterOffset = event.y - windowCenterY;
    var mouseXRatio = mouseXCenterOffset / windowCenterX;
    var mouseYRatio = mouseYCenterOffset / windowCenterY;

    var stickOrientation = Quat.fromPitchYawRollDegrees(mouseYRatio * -90, mouseXRatio * -90, 0);
    positionStick(stickOrientation);
}

function update() {
    var palmPosition = Controller.getSpatialControlPosition(controllerID);
    controllerActive = (Vec3.length(palmPosition) > 0);
    if (!controllerActive || !isFighting()) {
        return;
    }

    var stickOrientation = Controller.getSpatialControlRawRotation(controllerID);
    var adjustment = Quat.fromPitchYawRollDegrees(180, 0, 0);
    stickOrientation = Quat.multiply(stickOrientation, adjustment);

    positionStick(stickOrientation);
}

function toggleAway() {
    isAway = !isAway;
    if (isAway) {
        positionStick(AWAY_ORIENTATION);
        removeDisplay();
    } else {
        updateDisplay();
    }
}

function makeSword() {
    initControls();
    stickID = Entities.addEntity({
        type: "Model",
        modelURL: (whichModel === "sword") ? swordModel : stickModel,
        //compoundShapeURL: "https://hifi-public.s3.amazonaws.com/eric/models/stick.obj",
        shapeType: "box",
        dimensions: dimensions,
        position: (hand === 'right') ? MyAvatar.getRightPalmPosition() : MyAvatar.getLeftPalmPosition(), // initial position doesn't matter, as long as it's close
        rotation: MyAvatar.orientation,
        damping: 0.1,
        collisionSoundURL: "http://public.highfidelity.io/sounds/Collisions-hitsandslaps/swordStrike1.wav",
        restitution: 0.01,
        collisionsWillMove: true
    });
    actionID = Entities.addAction("hold", stickID, {relativePosition: {x: 0.0, y: 0.0, z: -dimensions.z / 2},
                                                    hand: hand,
                                                    timeScale: 0.15});
    if (actionID === nullActionID) {
        print('*** FAILED TO MAKE SWORD ACTION ***');
        cleanUp();
    }
    Script.addEventHandler(stickID, 'collisionWithEntity', scoreHit);
    updateDisplay();
}

function onClick(event) {
    switch (Overlays.getOverlayAtPoint(event)) {
    case swordButton:
        if (!stickID) {
            makeSword();
        } else {
            toggleAway();
        }
        break;
    case targetButton:
        var position = Vec3.sum(MyAvatar.position, {x: 1.0, y: 0.4, z: 0.0});
        var boxId = Entities.addEntity({
            type: "Box",
            name: "dummy",
            position: position,
            dimensions: {x: 0.3, y: 0.7, z: 0.3},
            gravity: {x: 0.0, y: -3.0, z: 0.0},
            damping: 0.2,
            collisionsWillMove: true
        });

        var pointToOffsetFrom = Vec3.sum(position, {x: 0.0, y: 2.0, z: 0.0});
        var action = Entities.addAction("offset", boxId, {pointToOffsetFrom: pointToOffsetFrom,
                                             linearDistance: 2.0,
                                             // linearTimeScale: 0.005
                                             linearTimeScale: 0.1
                                            });
        targetIDs.push({entity: boxId, action: action});
        break;
    case switchHandsButton:
        hand = hand === "right" ? "left" : "right";
        Settings.setValue("highfidelity.sword.hand", hand);
        cleanUp('leaveButtons');
        makeSword();
        break;
    case cleanupButton:
        cleanUp('leaveButtons');
        break;
    }
}

Script.scriptEnding.connect(cleanUp);
Controller.mouseMoveEvent.connect(mouseMoveEvent);
Controller.mousePressEvent.connect(onClick);
Script.update.connect(update);
MyAvatar.collisionWithEntity.connect(gotHit);
