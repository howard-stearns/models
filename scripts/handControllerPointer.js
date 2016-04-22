//
//  handControllerPointer.js
//  examples/controllers
//
//  Created by Howard Stearns on 2016/04/22
//  Copyright 2016 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

// For now:
// Right hand only.
// HMD only. (Desktop isn't turned off, but right now it's using
//            HMD.overlayFromWorldPoint(HMD.calculateRayUICollisionPoint ...) without compensation.)
// Cursor all the time when uncradled. (E.g., not just when blue ray is on, or five seconds after movement, etc.)
// Button 3 is left-mouse, button 4 is right-mouse.

function debug() { // Display the arguments not just [Object object].
    print.apply(null, [].map.call(arguments, JSON.stringify));
}

var UPDATE_INTERVAL = 20; // milliseconds. Script.update is too frequent.
var MAPPING_NAME = Script.resolvePath('');

var mapping = Controller.newMapping(MAPPING_NAME);
function mapToLeftClick(controller, button, action) {
    if (!Controller.Hardware[controller]) { return; }
    mapping.from(Controller.Hardware[controller][button]).peek().to(Controller.Actions[action]);
}
mapToLeftClick('Hydra', 'R3', 'ReticleClick');
mapToLeftClick('Hydra', 'R4', 'ContextMenu');
mapping.enable();

function update() {
    if (Controller.getValue(Controller.Standard.RT)) { return; } // Interferes with other scripts.
    var hand = Controller.Standard.RightHand,
	controllerPose = Controller.getPoseValue(hand);
    if (!controllerPose.valid) { return; } // Controller is cradled.
    var controllerPosition = Vec3.sum(Vec3.multiplyQbyV(MyAvatar.orientation, controllerPose.translation),
                                      MyAvatar.position),
	// This gets point direction right, but if you want general quaternion it would be more complicated:
	controllerDirection = Quat.getUp(Quat.multiply(MyAvatar.orientation, controllerPose.rotation)),
	hudPoint3d = HMD.calculateRayUICollisionPoint(controllerPosition, controllerDirection),
	hudPoint2d = HMD.overlayFromWorldPoint(hudPoint3d);
    Reticle.setPosition(hudPoint2d);
}

var updater = Script.setInterval(update, UPDATE_INTERVAL);
Script.scriptEnding.connect(function(){
    Script.clearInterval(updater);
    mapping.disable();
});
