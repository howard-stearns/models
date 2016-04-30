"use strict";
/*jslint vars: true, plusplus: true*/
/*globals Script, Overlays, Controller, Reticle, HMD, Camera, Entities, MyAvatar, Settings, Menu, ScriptDiscoveryService, Window, Vec3, Quat, print */
//  mouseHandController.js
//  examples/controllers
//
//  Positions your hand in front of you, and rotates it to point at wherever your mouse intersects the HUD.
//  CURRENTLY ONLY FOR DESKTOP, NOT HMD.
//
//  Created by Howard Stearns on 2016/04/28
//  Copyright 2016 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

// Utilities
//
function setupHandler(event, handler) {
    event.connect(handler);
    Script.scriptEnding.connect(function () { event.disconnect(handler); });
}


// Get the mouse events and keep track of the position
//
var mouseKeeper = {x: 0, y: 0};
function onMouseMoveCapture(event) { mouseKeeper.x = event.x; mouseKeeper.y = event.y; }
setupHandler(Controller.mouseMoveEvent, onMouseMoveCapture);
//Controller.captureMouseEvents(); // Ask the system to try to ignore all mouse events. Just let this script do it.
//Script.scriptEnding.connect(Controller.releaseMouseEvents);


// Now map the current mouseKeeper data to hand controller orientation.
//
var mapping = Controller.newMapping(Script.resolvePath(''));
Script.scriptEnding.connect(mapping.disable);

var verticalFieldOfView = 45; // degrees
var DEGREES_TO_HALF_RADIANS = Math.PI / 360;
var CONTROLLER_ROTATION = Quat.fromPitchYawRollDegrees(90, 180, -90);
mapping.from(function () {
    var originAvatarSpace = {x: 0.2, y: 0.2, z: -0.2};

    var size = Controller.getViewportDimensions();
    // In world-space 3D meters:
    var handPoint = Vec3.sum(MyAvatar.position,
                             Vec3.multiplyQbyV(MyAvatar.orientation, originAvatarSpace));
    var rotation = MyAvatar.orientation;
    var normal = Quat.getFront(rotation);
    var hudHeight = 2 * Math.tan(verticalFieldOfView * DEGREES_TO_HALF_RADIANS);
    var hudWidth = hudHeight * size.x / size.y;
    var rightFraction = mouseKeeper.x / size.x - 0.5;
    var rightMeters = rightFraction * hudWidth;
    var upFraction = mouseKeeper.y / size.y - 0.5;
    var upMeters = upFraction * hudHeight * -1;
    var right = Vec3.multiply(Quat.getRight(rotation), rightMeters);
    var up = Vec3.multiply(Quat.getUp(rotation), upMeters);
    var direction = Vec3.sum(normal, Vec3.sum(right, up));
    var mouseRotation = Quat.rotationBetween(normal, direction);

    var controllerRotation = Quat.multiply(Quat.multiply(mouseRotation, rotation), CONTROLLER_ROTATION);
    var inverseAvatar = Quat.inverse(MyAvatar.orientation);
    return {
        translation: Vec3.multiplyQbyV(inverseAvatar, Vec3.subtract(handPoint, MyAvatar.position)),
        rotation: Quat.multiply(inverseAvatar, controllerRotation),
        velocity: {x: 0, y: 0, z: 0},
        angularVelocity: {x: 0, y: 0, z: 0}
    };
}).to(Controller.Standard.RightHand);

mapping.enable();

