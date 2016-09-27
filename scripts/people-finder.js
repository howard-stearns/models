"use strict";
/*jslint vars: true, plusplus: true*/
/*globals Script, AvatarList, MyAvatar, Overlays, Vec3, Toolbars, Camera, Controller, location, print */
//
// people-finder.js
//
// Shows direction and distance of people in 3D, through walls, etc.
// Click on avatar overlay to go that avatar.
//
// Created by Howard Stearns on September 22, 2016
// Copyright 2016 High Fidelity, Inc
//
// Distributed under the Apache License, Version 2.0
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

// FIXME: Right now, this is done with 3D overlays, with the position set where the avatar is, and
// the size expanded for distant avatars so that the overlay is always visible in approximately constant size.
//
// But there are a bunch of limitations on this, such that we can't display exactly what's wanted. (See FIXMEs.)
//
// Maybe this would work better if we just used 2D overlay projections onto the HUD?

var overlays = {};
var ALPHA_TARGET = 0.5;
function ExtendedOverlay(key, overlay) { // A wrapper around overlays to store the avatarIdentifier it is associated with.
    overlays[key] = this;
    this.key = key;
    this.overlayIdentifier = overlay;
    this.getPosition = function () {
        // FIXME Overlays.getProperty(this.overlayIdentifier, 'position') doesn't work, so for now,
        // retain the avatarIdentifier and use that.
        return AvatarList.getAvatar(this.key).position;
    };
    // FIXME: I want to set the color dynamically, and I want to always drawInFront. But I can't get
    // either of these to work on model overlays. So for now, draw a model AND a sphere primitive.
    this.colorOverlayIdentifier = Overlays.addOverlay("sphere", {
        drawInFront: true, // still see people who are behind walls
        alpha: ALPHA_TARGET,
        solid: true // not mesh
    });
}
// Instance methods:
ExtendedOverlay.prototype.deleteOverlay = function () {
    Overlays.deleteOverlay(this.overlayIdentifier);
    Overlays.deleteOverlay(this.colorOverlayIdentifier);
    delete overlays[this.key];
};
ExtendedOverlay.prototype.editOverlay = function (properties) {
    Overlays.editOverlay(this.overlayIdentifier, properties);
    properties.dimensions = properties.dimensions.y; // FIXME: clicking doesn't work reliably unless I make the sphere clearly bigger than the mesh
    this.color = properties.color; // FIXME Overlays.getProperty(this.colorOverlayIdentifier, 'color') doesn't work.
    Overlays.editOverlay(this.colorOverlayIdentifier, properties);
};
ExtendedOverlay.prototype.highlight = function () {
    var base = this.color;
    var newColor = {red: base.red, green: base.green + 50, blue: base.blue};
    Overlays.editOverlay(this.colorOverlayIdentifier, {color: newColor});
};
// Class methods:
ExtendedOverlay.get = function (key) {
    return overlays[key];
};
ExtendedOverlay.some = function (iterator) { // Bails early as soon as iterator returns truthy.
    var key;
    for (key in overlays) {
        if (iterator(overlays[key])) {
            return;
        }
    }
};
ExtendedOverlay.applyPickRay = function (pickRay, cb) { // cb(overlay) on the overlay intersected by pickRay, if any.
    var pickedOverlay = Overlays.findRayIntersection(pickRay);
    if (!pickedOverlay.intersects) {
        return;
    }
    ExtendedOverlay.some(function (overlay) { // See if pickedOverlay is one of ours.
        if (overlay.colorOverlayIdentifier == pickedOverlay.overlayID) {
            cb(overlay);
            return true;
        }
    });
};

if (!Math.sign) {
    Math.sign = function (n) {
        if (n > 0) { return 1; }
        if (n < 0) { return -1; }
        return 0;
    };
}
function range(fraction, min, max) {
    return (fraction * (max - min)) + min;
}

var MAX_COLOR_COMPONENT = 250;
var MIN_COLOR_COMPONENT = 20;
function colorComponent(fraction) {
    return range(fraction, MIN_COLOR_COMPONENT, MAX_COLOR_COMPONENT);
}

var TAN_ALPHA = 0.1;    // Arbitrary constant angular size of avatars.
var REDUCED_TAN_ALPHA = 0.01;    // Some scaling down, but not much.
var SCALE = 100;        // Everything past this distance is blue. Becomes red ("hot") as you get closer.
var pingPong = false;
var MAX_HORIZONTAL_ANGLE = 25; // degrees
var MAX_VERTICAL_ANGLE = 10;
function update() { // Update the overlays to align with all the other avatars.
    var avatarIdentifiers = AvatarList.getAvatarIdentifiers();

    // Update the positions and colors.
    var myPosition = MyAvatar.position;
    var viewer = Camera.orientation;
    var forward = Quat.getFront(viewer);
    pingPoing = !pingPong;
    avatarIdentifiers.forEach(function (identifier) {
        if (!identifier) { // Don't need one for me.
            return;
        }
        var overlay = ExtendedOverlay.get(identifier);
        if (!overlay) { // add one
            overlay = new ExtendedOverlay(identifier, Overlays.addOverlay("model", {
                drawInFront: true, // still see people who are behind walls
                alpha: ALPHA_TARGET,
                solid: true, // not mesh
                url: "http://hifi-content.s3.amazonaws.com/alan/dev/Person-basemesh.fbx"
            }));
        }
        overlay.touched = pingPong;
        var avatar = AvatarList.getAvatar(identifier);
        var position = avatar.position;
        var vector = Vec3.subtract(position, myPosition);
        var distance = Vec3.length(vector);
        /*
        var swing = Quat.rotationBetween(forward, Vec3.normalize(vector));
        var decomposed = Quat.safeEulerAngles(swing);
        var pitchUp = decomposed.x;
        var yawLeft = decomposed.y;
        var clampedPitch = Math.sign(pitchUp) * Math.min(Math.abs(pitchUp), MAX_VERTICAL_ANGLE);
        var clampedYaw = Math.sign(yawLeft) * Math.min(Math.abs(yawLeft), MAX_HORIZONTAL_ANGLE);
        var clampedSwing = Quat.fromPitchYawRollDegrees(clampedPitch, clampedYaw, decomposed.z);
        var clampedPosition = Vec3.sum(myPosition, Vec3.multiplyQbyV(clampedSwing, Vec3.multiply(distance, forward)));
        */
        var clampedPosition = position;
        var fraction = Math.min(1.0, distance / SCALE);
        var principleDimension = range(1 - fraction, REDUCED_TAN_ALPHA, TAN_ALPHA) * distance;
        var secondaryDimension = principleDimension * 0.2;
        var properties = {
            color: { red: colorComponent(1 - fraction), green: MIN_COLOR_COMPONENT, blue: colorComponent(fraction) },
            // FIXME: I'm sure we need the diameter to get slightly smaller with distance, so that I end up intersecting with
            // the nearest of multiple overlays that I click on. However, I'm not sure that I got this right.
            dimensions: {y: principleDimension, x: secondaryDimension, z: secondaryDimension},
            position: clampedPosition
            // MAYBE FIXME: should the mesh always turn to face me?
        };
        overlay.editOverlay(properties);
    });

    // Delete any overlays that were not touched.
    ExtendedOverlay.some(function (overlay) {
        if (overlay.touched !== pingPong) {
            overlay.deleteOverlay();
        }
    });

    // See if the mouse is over any of ours, and highlight it.
    var cursor = Reticle.position;
    ExtendedOverlay.applyPickRay(Camera.computePickRay(cursor.x, cursor.y), function (overlay) {
        overlay.highlight();
    });
}

function handleClick(pickRay) { // Go to the associated avatar if pickRay is to one of our overlays.
    ExtendedOverlay.applyPickRay(pickRay, function (overlay) {
        // Go to within a short distance from that overlay center -- i.e., to the other avatar.
        // It isn't good enough to go to the pickedOverlay.intersection, because our overlay dimensions
        // are quite large for distant overlays.
        var center = overlay.getPosition();
        var vector = Vec3.subtract(center, MyAvatar.position);
        var distance = Vec3.length(vector);
        var target = Vec3.multiply(Vec3.normalize(vector), distance - 1.0);
        // FIXME: We would like the avatar to recompute the "maybe fly" test at the new position, so that if high enough up,
        // the avatar goes into fly mode rather than falling. However, that is not exposed to Javascript right now.
        // FIXME: it would be nice if this used the same teleport steps and smoothing as in the teleport.js script.
        // Note, however, that this script allows teleporting to a person in the air, while teleport.js is going to a grounded target.
        MyAvatar.position = Vec3.sum(MyAvatar.position, target);
        return true;
    });
}
function handleMouseEvent(event) {
    if (!event.isLeftButton) {
        return;
    }
    handleClick(Camera.computePickRay(event.x, event.y));
}
// FIXME: This also needs to work with laser triggering, not just mouse!

var buttonName = 'people-finder';
var toolBar = Toolbars.getToolbar("com.highfidelity.interface.toolbar.system");
var OFF_STATE = 1, ON_STATE = 0; // weird
var button = toolBar.addButton({
    objectName: buttonName,
    imageURL: Script.resolvePath("assets/images/tools/nearby.svg"), // fixme!
    visible: true,
    buttonState: OFF_STATE,
    defaultState: OFF_STATE,
    hoverState: 2,
    alpha: 0.9,
});
function setButtonState(state) {
    button.writeProperty("buttonState", state);
    button.writeProperty("defaultState", state);
}

var ticker, expires;
function clearExpiration() {
    if (!expires) {
        return;
    }
    Script.clearTimeout(expires);
    expires = undefined;
}
function startSearch() {
    clearExpiration();
    // FIXME: normal Script.update is too fast for weaker hardware.
    ticker = Script.setInterval(update, 60); //FIXME 180);
    Controller.mousePressEvent.connect(handleMouseEvent);
    setButtonState(ON_STATE);
}
function stopSearch() {
    clearExpiration();
    if (ticker) {
        Script.clearInterval(ticker);
        ticker = undefined;
        Controller.mousePressEvent.disconnect(handleMouseEvent);
    }
    setButtonState(OFF_STATE);
    ExtendedOverlay.some(function (overlay) {
        overlay.deleteOverlay();
    });
}
function toggleSearch() {
    if (ticker) {
        stopSearch();
    } else {
        startSearch();
    }
}

function startSearchForAwhile() {
    stopSearch();
    startSearch();
    expires = Script.setTimeout(stopSearch, 10000);
}
location.hostChanged.connect(startSearchForAwhile);

button.clicked.connect(toggleSearch);
Script.scriptEnding.connect(function () {
    location.hostChanged.disconnect(startSearchForAwhile);
    button.clicked.disconnect(toggleSearch);
    stopSearch();
    toolBar.removeButton(buttonName);
});
