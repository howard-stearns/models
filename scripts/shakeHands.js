"use strict";
/*jslint vars: true, plusplus: true*/
var AvatarList, MyAvatar, Script, Vec3, Quat, print, Controller; // Declare globals so that jslint does not complain.
var updateTriggers; // forward reference

// Prototype and testbed for two avatars shaking hands.
//
// As long as you press the hydra trigger (or press the 'x' key if there is no hydra off-hook), your avatar's hand will be set to the average of its
// current position and that of the other avatar in the space with you, weighted by 'yourMix'.
// (If there is no other avatar, it averages against yourself, which is handy for testing)
// See FIXMEs.
//
// Requires:
// - https://github.com/highfidelity/hifi/pull/6097;
// - Developer->Avatars->Enable Anim Graph on.
// - If you want the other avatar to also move it's hand, it needs to ALSO run this script on its own Interface, with the same requirements.

var triggerDeadband = 0.1;
var yourMix = 0.25;  // How much of your own motion data to include, compared with the other avatar's result (out of 1.0).
var maxAvatarDistance = 1.25; // meters.  Best results within 1m, maybe 0.8. 1.25 is about max. 
var jointName = 'RightHand';
var hipsName = 'Hips';
var animVarName = 'rightHandPosition';
function findJointIndex(avatar, jointName) { // return joint index for that name. 
    // FIXME: Currently by exact name, expected standard avatars. Should look for best match among avatar.jointNames(), or use parent structure topoloogy.
    return avatar.getJointIndex(jointName);
}
function findOtherAvatar() {
    // A pun for debugging: If there are no other avatars in range, the otherAvatar is you!
    // In that case, this script should end up averaging yourself with (previous frame of) yourself, which is useful for debugging.
    var closestDistance = maxAvatarDistance, closestAvatar = MyAvatar;
    AvatarList.getAvatarIdentifiers().forEach(function (identifier) {
        if (!identifier) { return; }
        var avatar = AvatarList.getAvatar(identifier), distance = Vec3.distance(avatar.position, MyAvatar.position);
        if (distance && (distance < closestDistance)) {
            closestDistance = distance;
            closestAvatar = avatar;
        }
    });
    return closestAvatar;
}

// For transforming between world space and our avatar's model space. 
var myHipsJointIndex, avatarToModelTranslation, avatarToWorldTranslation, avatarToWorldRotation, worldToAvatarRotation;
var avatarToModelRotation = Quat.angleAxis(180, {x: 0, y: 1, z: 0}); // N.B.: Our C++ angleAxis takes radians, while our javascript angleAxis takes degrees!
var modelToAvatarRotation = Quat.inverse(avatarToModelRotation); // Flip 180 gives same result without inverse, but being explicit to track the math.
function updateMyCoordinateSystem() {
    avatarToWorldTranslation = MyAvatar.position;
    avatarToWorldRotation = MyAvatar.orientation;
    worldToAvatarRotation = Quat.inverse(avatarToWorldRotation);
    avatarToModelTranslation = MyAvatar.getJointTranslation(myHipsJointIndex); // Should really be done on the bind pose.
}

// Just math. 
function modelToWorld(modelPoint) {
    var avatarPoint = Vec3.subtract(Vec3.multiplyQbyV(modelToAvatarRotation, modelPoint), avatarToModelTranslation);
    return Vec3.sum(Vec3.multiplyQbyV(avatarToWorldRotation, avatarPoint), avatarToWorldTranslation);
}
function worldToModel(worldPoint) {
    var avatarPoint = Vec3.multiplyQbyV(worldToAvatarRotation, Vec3.subtract(worldPoint, avatarToWorldTranslation));
    return Vec3.multiplyQbyV(avatarToModelRotation, Vec3.sum(avatarPoint, avatarToModelTranslation));
}

// Debugging stuff.
var debugPrintCountdown;
function debugPrint(object) { if (debugPrintCountdown > 0) { print(JSON.stringify(object)); debugPrintCountdown--; } }


var otherAvatar, otherAvatarHandJointIndex; // We don't need to update these during the shake.
var myAvatarHandJointIndex, fallbackPosition; // In case someone is shaking our hand without us having a controller.

function shakeHands(animationProperties) { // We are given an object with the animation variables that we registered for (using addAnimationStateHandler, below). 

    // updateMyCoordinateSystem(); // For debugging, it may be convenient to allow the avatar to move around

    var yourCurrentTarget = animationProperties[animVarName] ||                            // model space
        fallbackPosition; // If no controller, do let our hand be shaken.
        //worldToModel(MyAvatar.getJointPosition(myAvatarHandJointIndex)); // This ought to work just as well as the line above, but it doesn't!!
    var yourHandPosition = modelToWorld(yourCurrentTarget);                                // world space
    var otherAvatarHandPosition;
    try {
        otherAvatarHandPosition = otherAvatar.getJointPosition(otherAvatarHandJointIndex); // word space (just us again if no other avatar)
    } catch (e) {
        print("Other avatar has left during the handshake.");
        updateTriggers(false);
    }
    var average = Vec3.mix(otherAvatarHandPosition, yourHandPosition, yourMix);            // world space
    var averageInModelSpace = worldToModel(average);                                       // model space
    // FIXME?: We might want a small offset towards model +x to account for the palm thickness.
    debugPrint({hand: yourCurrentTarget, hips: avatarToModelTranslation, world: yourHandPosition, other: otherAvatarHandPosition, average: average, target: averageInModelSpace});
    var result = {};   // Callback returns an object with properties that we want the animation system to use.
    result[animVarName] = averageInModelSpace;
    return result;
}

function startHandshake() {
    print('START HANDSHAKE');
    debugPrintCountdown = 2;

    // Grab other avatar info:
    otherAvatar = findOtherAvatar();
    otherAvatarHandJointIndex = findJointIndex(otherAvatar, jointName);

    // Grab our info, assuming that the avatar doesn't move during the handshake:
    myHipsJointIndex = findJointIndex(MyAvatar, hipsName);
    updateMyCoordinateSystem();
    myAvatarHandJointIndex = findJointIndex(MyAvatar, jointName); // only used as a no-hydra fallback
    fallbackPosition = worldToModel(MyAvatar.getJointPosition(myAvatarHandJointIndex));

    // Debug stuff:
    print("other avatar name:", otherAvatar.displayName,
          "other position:", JSON.stringify(otherAvatar.position),
          "other avatar hand index:", otherAvatarHandJointIndex,
          "my hand index:", myAvatarHandJointIndex);

    // Register averageHands with my avatar's animation system.
    MyAvatar.addAnimationStateHandler(shakeHands, [animVarName]); // The second argument is currently ignored.
}

function endHandshake() {  // Tell the animation system we don't need any more callbacks.
    print('END HANDSHAKE');
    MyAvatar.removeAnimationStateHandler(shakeHands);
}

Script.scriptEnding.connect(endHandshake);
var isOn = false;
function updateTriggers(activate) { // start or end handshake based on whether activate is true, and on current handshake state.
    if (activate) {
        if (!isOn) {
            isOn = true;
            startHandshake();
        }
    } else if (isOn) {
        isOn = false;
        endHandshake();
    }
}
function pollHandController() { // It would be better to have an event to connect to!
    var data = Controller.getSpatialControlPosition(0);
    if (!data.x && !data.y && !data.z) { return; } // It would be nice to have a better way to detect whether hand controllers are in use!
    updateTriggers(Controller.getActionValue(Controller.findAction("RIGHT_HAND_CLICK")) > triggerDeadband);
}
Script.update.connect(pollHandController);
Controller.keyPressEvent.connect(function (event) { if (event.text === "x") { updateTriggers(true); } });
Controller.keyReleaseEvent.connect(function (event) { if (event.text === "x") { updateTriggers(false); } });
