"use strict";
/*jslint vars: true, plusplus: true*/
/*globals Script, AvatarList, MyAvatar, Overlays, Vec3, Toolbars, Camera, Controller, print */
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

var overlays = [];
var ALPHA_TARGET = 0.5;
function ExtendedOverlay(overlay) { // A wrapper around overlays to store the avatarIdentifier it is associated with.
    this.overlayIdentifier = overlay;
    this.getPosition = function () {
        // FIXME Overlays.getProperty(this.overlayIdentifier, 'position') doesn't work, so for now,
        // retain the avatarIdentifier and use that.
        return AvatarList.getAvatar(this.avatarIdentifier).position;
    };
    // FIXME: I want to set the color dynamically, and I want to always drawInFront. But I can't get
    // either of these to work on model overlays. So for now, draw a model AND a sphere primitive.
    this.colorOverlayIdentifier = Overlays.addOverlay("sphere", {
        drawInFront: true, // still see people who are behind walls
        alpha: ALPHA_TARGET,
        solid: true // not mesh
    });
    this.deleteOverlay = function () {
        Overlays.deleteOverlay(this.overlayIdentifier);
        Overlays.deleteOverlay(this.colorOverlayIdentifier);
    };
    this.editOverlay = function (properties, avatarIdentifier) {
        Overlays.editOverlay(this.overlayIdentifier, properties);
        properties.dimensions = properties.dimensions.y; // FIXME: clicking doesn't work reliably unless I make the sphere clearly bigger than the mesh
        Overlays.editOverlay(this.colorOverlayIdentifier, properties);
        this.avatarIdentifier = avatarIdentifier;
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
function update() { // Update the overlays to align with all the other avatars.
    var avatarIdentifiers = AvatarList.getAvatarIdentifiers();

    // Add missing overlays, or remove extras.
    var deficit = avatarIdentifiers.length - 1 - overlays.length; // Don't need one for me.
    if (deficit > 0) {
        while (deficit-- > 0) {
            overlays.push(new ExtendedOverlay(Overlays.addOverlay("model", {
                drawInFront: true, // still see people who are behind walls
                alpha: ALPHA_TARGET,
                solid: true, // not mesh
                url: "http://hifi-content.s3.amazonaws.com/alan/dev/Person-basemesh.fbx"
            })));
        }
    } else if (deficit < 0) {
        while (deficit++ < 0) {
            overlays.pop().deleteOverlay();
        }
    }

    // Update the positions and colors.
    var myPosition = MyAvatar.position, count = 0;
    avatarIdentifiers.forEach(function (identifier) {
        if (!identifier) { // Don't need one for me.
            return;
        }
        var position = AvatarList.getAvatar(identifier).position;
        var distance = Vec3.distance(position, myPosition);
        var fraction = Math.min(1.0, distance / SCALE);
        var principleDimension = range(1 - fraction, REDUCED_TAN_ALPHA, TAN_ALPHA) * distance;
        var secondaryDimension = principleDimension * 0.2;
        var properties = {
            color: { red: colorComponent(1 - fraction), green: MIN_COLOR_COMPONENT, blue: colorComponent(fraction) },
            // FIXME: I'm sure we need the diameter to get slightly smaller with distance, so that I end up intersecting with
            // the nearest of multiple overlays that I click on. However, I'm not sure that I got this right.
            dimensions: {y: principleDimension, x: secondaryDimension, z: secondaryDimension},
            position: position
            // MAYBE FIXME: should the mesh always turn to face me?
        };
        overlays[count++].editOverlay(properties, identifier);
    });
}

function handleRay(pickRay) { // Go to the associated avatar if pickRay is to one of our overlays.
    var index, overlay, center, vector, distance, pickedOverlay = Overlays.findRayIntersection(pickRay);
    if (!pickedOverlay.intersects) {
        return;
    }
    for (index = 0; index < overlays.length; index++) { // See if pickedOverlay is one of ours.
        overlay = overlays[index];
        if (overlay.colorOverlayIdentifier === pickedOverlay.overlayID) {
            // Go to within a short distance from that overlay center -- i.e., to the other avatar.
            // It isn't good enough to go to the pickedOverlay.intersection, because our overlay dimensions
            // are quite large for distant overlays.
            center = overlay.getPosition();
            vector = Vec3.subtract(center, MyAvatar.position);
            distance = Vec3.length(vector);
            target = Vec3.multiply(Vec3.normalize(vector), distance - 1.0);
            // FIXME: We would like the avatar to recompute the "maybe fly" test at the new position, so that if high enough up,
            // the avatar goes into fly mode rather than falling. However, that is not exposed to Javascript right now.
            // FIXME: it would be nice if this used the same teleport steps and smoothing as in the teleport.js script.
            // Note, however, that this script allows teleporting to a person in the air, while teleport.js is going to a grounded target.
            MyAvatar.position = Vec3.sum(MyAvatar.position, target);
            return;
        }
    }
}
function handleMouseEvent(event) {
    if (!event.isLeftButton) {
        return;
    }
    handleRay(Camera.computePickRay(event.x, event.y));
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
    ticker = Script.setInterval(update, 180);
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
    while (overlays.length) {
        overlays.pop().deleteOverlay();
    }
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
