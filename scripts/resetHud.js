"use strict";
/*jslint vars: true, plusplus: true*/
/*globals Script, Overlays, Controller, Reticle, HMD, Camera, Entities, MyAvatar, Settings, Menu, ScriptDiscoveryService, Window, Vec3, Quat, print */
//
//  resetHud.js
//  scripts/system
//
//  Scripted control over HUD for room-scale VR
//
//  Created by Howard Stearns on 2016/04/22
//  Copyright 2016 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

var lastLockout = Date.now();
var LOCKOUT_TIME = 500; // ms. Minimum time between state changes.
function lockoutExpired() {
    return (Date.now() - lastLockout) > LOCKOUT_TIME;
}
var hudVisible = true;
function hudOff() {
    if (!hudVisible || !lockoutExpired()) {
        return;
    }
    hudVisible = false;
    lastLockout = Date.now();
    Menu.setIsOptionChecked("Overlays", false);
}
function hudOn() {
    if (hudVisible || !lockoutExpired()) {
        return;
    }
    hudVisible = true;
    lastLockout = Date.now();
    //MyAvatar.reset(true); // FIXME
    Menu.setIsOptionChecked("Overlays", true);
}

var lastPosition = MyAvatar.position;
function onUpdate() {
    var currentPosition = MyAvatar.position;
    if ((lastPosition.x !== currentPosition.x) || (lastPosition.y !== currentPosition.y) || (lastPosition.z !== currentPosition.z)) {
        lastPosition = currentPosition;
        hudOff();
    } else {
        hudOn();
    }
}
var UPDATE_INTERVAL = 100; // ms
var updater = Script.setInterval(onUpdate, UPDATE_INTERVAL);
Script.scriptEnding.connect(function () {
    Script.clearInterval(updater);
});
