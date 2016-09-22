//
// people-finder.js
//
// Shows direction and distance of people in 3D, through walls, etc.
//
// Created by Howard Stearns on September 22, 2016
// Copyright 2016 High Fidelity, Inc
//
// Distributed under the Apache License, Version 2.0
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

var overlays = [];

var TAN_ALPHA = 0.1; // arbitrary
var SCALE = 500; // Everything past this distance is blue. Becomes red ("hot") as you get closer.
var MAX_COLOR_COMPONENT = 250;
var MIN_COLOR_COMPONENT = 20;
function colorComponent(fraction) {
    return (fraction * (MAX_COLOR_COMPONENT - MIN_COLOR_COMPONENT)) + MIN_COLOR_COMPONENT;
}

function update() {
    var avatarIdentifiers = AvatarList.getAvatarIdentifiers();

    // Add missing overlays, or remove extras.
    var deficit = avatarIdentifiers.length - 1 - overlays.length; // Don't need one for me.
    if (deficit > 0) {
        while (deficit-- > 0) {
            overlays.push(Overlays.addOverlay("sphere", {
                drawInFront: true, // still see people who are behind walls
                alpha: 0.85,
                solid: true, // not mesh
            }));
        }
    } else if (deficit < 0) {
        while (deficit++ < 0) {
            Overlays.deleteOverlay(overlays.pop());
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
        var properties = {
            color: { red: colorComponent(1 - fraction), green: MIN_COLOR_COMPONENT, blue: colorComponent(fraction) },
            dimensions: TAN_ALPHA * distance, 
            position: position
        };
        Overlays.editOverlay(overlays[count++], properties);
    });
}
Script.update.connect(update);
Script.scriptEnding.connect(function () {
    overlays.forEach(Overlays.deleteOverlay);
    Script.update.disconnect(update);    
});

