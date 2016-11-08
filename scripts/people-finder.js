"use strict";
/*jslint vars: true, plusplus: true, forin: true*/
/*globals Script, AvatarList, MyAvatar, Overlays, Vec3, Quat, Toolbars, Camera, Controller, Reticle, HMD, location, print */
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

var version = 1;
function debug() {
    print.apply(null, [].concat.apply(['people', version], [].map.call(arguments, JSON.stringify)));
}

var overlays = {}; // Keeps track of all our extended overlay data objects, keyed by target identifier.
var ALPHA_TARGET = 0.5;
function ExtendedOverlay(key, properties) { // A wrapper around overlays to store the key it is associated with.
    overlays[key] = this;
    this.key = key;
    // FIXME: I want to set the color dynamically, and I want to always drawInFront. But I can't get
    // EITHER of these to work on model overlays. So for now, draw a model AND a sphere primitive.
    //this.overlayIdentifier = Overlays.addOverlay("model", properties);
    delete properties.model;
    this.colorOverlayIdentifier = Overlays.addOverlay("sphere", properties);
}
// Instance methods:
ExtendedOverlay.prototype.deleteOverlay = function () { // remove display and data of this overlay
    //Overlays.deleteOverlay(this.overlayIdentifier);
    Overlays.deleteOverlay(this.colorOverlayIdentifier);
    delete overlays[this.key];
};
ExtendedOverlay.prototype.editOverlay = function (properties) { // change display of this overlay
    //Overlays.editOverlay(this.overlayIdentifier, properties);
    properties.dimensions = properties.dimensions.y; // FIXME: clicking doesn't work reliably unless I make the sphere clearly bigger than the mesh
    this.color = properties.color; // FIXME Overlays.getProperty(this.colorOverlayIdentifier, 'color') doesn't work, so save it separately.
    Overlays.editOverlay(this.colorOverlayIdentifier, properties);
};
ExtendedOverlay.prototype.highlight = function () {
    var base = this.color;
    var newColor = {red: base.red, green: base.green + 50, blue: base.blue};
    Overlays.editOverlay(this.colorOverlayIdentifier, {color: newColor});
};
// Class methods:
ExtendedOverlay.get = function (key) { // answer the extended overlay data object associated with the given avatar identifier
    return overlays[key];
};
ExtendedOverlay.some = function (iterator) { // Bails early as soon as iterator returns truthy.
    var key;
    for (key in overlays) {
        if (iterator(ExtendedOverlay.get(key))) {
            return;
        }
    }
};
ExtendedOverlay.applyPickRay = function (pickRay, cb) { // cb(overlay) on the one overlay intersected by pickRay, if any.
    var pickedOverlay = Overlays.findRayIntersection(pickRay); // Depends on nearer coverOverlays to extend closer to us than farther ones.
    if (!pickedOverlay.intersects) {
        return;
    }
    ExtendedOverlay.some(function (overlay) { // See if pickedOverlay is one of ours.
        if (overlay.colorOverlayIdentifier === pickedOverlay.overlayID) {
            cb(overlay);
            return true;
        }
    });
};

function range(fraction, min, max) {  // Answer number fraction of the way from min to max. 
    return (fraction * (max - min)) + min;
}

function projectVectorOntoPlane(normalizedVector, planeNormal) {
    return Vec3.cross(planeNormal, Vec3.cross(normalizedVector, planeNormal));
}
function angleBetweenVectorsInPlane(from, to, normal) {
    var projectedFrom = projectVectorOntoPlane(from, normal);
    var projectedTo = projectVectorOntoPlane(to, normal);
    return Vec3.orientedAngle(projectedFrom, projectedTo, normal);
}

var MAX_HORIZONTAL_ANGLE = 35; // degrees
var MAX_VERTICAL_ANGLE_HMD = 30 ; //20;
var MAX_VERTICAL_ANGLE_DESKTOP = 20;

var MAX_COLOR_COMPONENT = 250;
var MIN_COLOR_COMPONENT = 20;
function colorComponent(fraction) { // Answer fraction of the way from min to max color component.
    return range(fraction, MIN_COLOR_COMPONENT, MAX_COLOR_COMPONENT);
}



var TAN_ALPHA = 0.1;    // Arbitrary constant angular size of avatars.
var REDUCED_TAN_ALPHA = 0.01;    // Some scaling down, but not much.
var SCALE = 100;        // Everything past this distance is blue. Becomes red ("hot") as you get closer.
var pingPong = false;   // Alternates each update, so we can figure out which overlays were processed during the current iteration.

function update() { // Update the overlays to align with all the other avatars.
    // Update the positions and colors.
    var viewer = Camera.orientation;
    var forward = Quat.getFront(viewer);
    pingPong = !pingPong;

    var viewCenter = Camera.position;
    var up = Quat.getUp(viewer);
    var right = Quat.getRight(viewer);

    AvatarList.getAvatarIdentifiers().forEach(function (identifier) {
        if (!identifier) { // Don't need one for me.
            return;
        }
        var overlay = ExtendedOverlay.get(identifier);
        if (!overlay) { // add one
            overlay = new ExtendedOverlay(identifier, {
                drawInFront: true, // still see people who are behind walls
                alpha: ALPHA_TARGET,
                solid: true, // not mesh
                url: "http://hifi-content.s3.amazonaws.com/alan/dev/Person-basemesh.fbx"
            });
        }
        overlay.position = AvatarList.getAvatar(identifier).position;
        overlay.touched = pingPong;
        var position = overlay.position;
        var vector = Vec3.subtract(position, viewCenter);
        var distance = Vec3.length(vector);
        var normalizedVector = Vec3.multiply(1 / distance, vector);
        var MAX_VERTICAL_ANGLE = HMD.active ? MAX_VERTICAL_ANGLE_HMD : MAX_VERTICAL_ANGLE_DESKTOP;

        var horizontalAngle = angleBetweenVectorsInPlane(forward, normalizedVector, up);
        var verticalAngle =  angleBetweenVectorsInPlane(forward, normalizedVector, right);
        var clampedHorizontalAngle = Math.min(Math.max(-MAX_HORIZONTAL_ANGLE, horizontalAngle), MAX_HORIZONTAL_ANGLE);
        var clampedVerticalAngle = Math.min(Math.max(-MAX_VERTICAL_ANGLE, verticalAngle), MAX_VERTICAL_ANGLE);
        var clampedDirection = Vec3.multiplyQbyV(Quat.multiply(Quat.angleAxis(clampedHorizontalAngle, up), Quat.angleAxis(clampedVerticalAngle, right)), forward);
        var horizontalAngleRecovered = angleBetweenVectorsInPlane(forward, clampedDirection, up);
        var verticalAngleRecovered =  angleBetweenVectorsInPlane(forward, clampedDirection, right);
        var clampedPosition = Vec3.sum(viewCenter, Vec3.multiply(distance, clampedDirection));

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

    // See if the mouse is over any of ours, highlight it.
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
        var center = overlay.position;
        var vector = Vec3.subtract(center, MyAvatar.position);
        var distance = Vec3.length(vector);
        var target = Vec3.multiply(Vec3.normalize(vector), distance - 1.0);
        // FIXME: We would like the avatar to recompute the avatar's "maybe fly" test at the new position, so that if high enough up,
        // the avatar goes into fly mode rather than falling. However, that is not exposed to Javascript right now.
        // FIXME: it would be nice if this used the same teleport steps and smoothing as in the teleport.js script.
        // Note, however, that this script allows teleporting to a person in the air, while teleport.js is going to a grounded target.
        MyAvatar.position = Vec3.sum(MyAvatar.position, target);
        return true;
    });
}
function handleMouseEvent(mousePressEvent) { // handleClick if we get one.
    if (!mousePressEvent.isLeftButton) {
        return;
    }
    handleClick(Camera.computePickRay(mousePressEvent.x, mousePressEvent.y));
}
// FIXME: This also needs to work with laser triggering, not just mouse!

var buttonName = 'people-finder';
var toolBar = Toolbars.getToolbar("com.highfidelity.interface.toolbar.system");
var OFF_STATE = 1, ON_STATE = 0; // weird
var button = toolBar.addButton({  // a three-state button (on/off/hover) on the toolbar
    objectName: buttonName,
    imageURL: Script.resolvePath("assets/images/tools/nearby.svg"), // fixme!
    visible: true,
    buttonState: OFF_STATE,
    defaultState: OFF_STATE,
    hoverState: 2,
    alpha: 0.9,
});
function setButtonState(state) { // Make button display as either OFF_STATE or ON_STATE
    button.writeProperty("buttonState", state);
    button.writeProperty("defaultState", state);
}

var ticker, expires;
function clearExpiration() { // stop expiration timer, if any.
    if (!expires) {
        return;
    }
    Script.clearTimeout(expires);
    expires = undefined;
}
function startSearch() { // start display updates and make button match
    clearExpiration();
    //ticker = Script.setInterval(update, 180); // FIXME: normal Script.update is too fast for weaker hardware.
    ticker = true; Script.update.connect(update);
    Controller.mousePressEvent.connect(handleMouseEvent);
    setButtonState(ON_STATE);
}
function stopSearch() { // stop display update (and any pending expiration), make button match, and clear overlays
    clearExpiration();
    if (ticker) {
        //Script.clearInterval(ticker);
        Script.update.disconnect(update);
        ticker = undefined;
        Controller.mousePressEvent.disconnect(handleMouseEvent);
    }
    setButtonState(OFF_STATE);
    ExtendedOverlay.some(function (overlay) {
        overlay.deleteOverlay();
    });
}
function toggleSearch() { // stop/start as needed
    if (ticker) {
        stopSearch();
    } else {
        startSearch();
    }
}

function startSearchForAwhile() { // start search for a while and then stop.
    stopSearch();
    startSearch();
    expires = Script.setTimeout(stopSearch, 10000); // FIXME: it would be nice if this were a fade-out.
}
location.hostChanged.connect(startSearchForAwhile);

button.clicked.connect(toggleSearch);  // hook up button
Script.scriptEnding.connect(function () { // clean up
    location.hostChanged.disconnect(startSearchForAwhile);
    button.clicked.disconnect(toggleSearch);
    stopSearch();
    toolBar.removeButton(buttonName);
});
