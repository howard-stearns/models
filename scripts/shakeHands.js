"use strict";
/*jslint vars: true, plusplus: true*/
var AvatarList, MyAvatar, Script, Vec3, Quat, print, Controller; // Declare globals so that jslint does not complain.
// Prototype and testbed for two avatars shaking hands.

// This current version is just the basics: as long as the script is running, it will try to average your hand position with that of the first other avatar it finds.
// I.e., there is no stop/start other than starting/stopping the script.
// Requires:
// - https://github.com/highfidelity/hifi/pull/6097;
// - Developer->Avatars->Enable Anim Graph on.
// - Your right hydra must be in use (and off-hook).
// - If you want the other avatar to also move it's hand, it needs to ALSO run this script on its own Interface, with the same requirements.

// If false, we always allow folks to grab our hand and shake it as long as script is running, without us doing anything.
function hasHydra() {
    var data = Controller.getSpatialControlPosition(0);
    return data.x || data.y || data.z; // or hardcode a boolean
}

var jointName = 'RightHand'; // Actually, this 
var hipsName = 'Hips';
var animVarName = 'rightHandPosition';
function findJointIndex(avatar, jointName) { // return joint index for that name. 
    // FIXME: Currently by exact name. Should look for best match among avatar.jointNames(), or use parent structure topoloogy
    return avatar.getJointIndex(jointName);
}
function findOtherAvatar() {
    var allAvatarIdsIncludingYours = AvatarList.getAvatars(); // Yours has null id
    var theFirstAvatarIdNotYou = allAvatarIdsIncludingYours[0] || allAvatarIdsIncludingYours[1]; // FIXME: grab the closest one.
    // A pun for debugging: If there are no other avatars, the otherAvatar is you! (That's how getAvatar("junkId") works.)
    // In that case, this script should end up averaging yourself with (previous frame of) yourself, which is useful for debugging.
    return AvatarList.getAvatar(theFirstAvatarIdNotYou);
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
function vectorAverage(point1, point2) { return Vec3.multiply(0.5, Vec3.sum(point1, point2)); }
function modelToWorld(modelPoint) {
    var avatarPoint = Vec3.subtract(Vec3.multiplyQbyV(modelToAvatarRotation, modelPoint), avatarToModelTranslation);
    return Vec3.sum(Vec3.multiplyQbyV(avatarToWorldRotation, avatarPoint), avatarToWorldTranslation);
}
function worldToModel(worldPoint) {
    var avatarPoint = Vec3.multiplyQbyV(worldToAvatarRotation, Vec3.subtract(worldPoint, avatarToWorldTranslation));
    return Vec3.multiplyQbyV(avatarToModelRotation, Vec3.sum(avatarPoint, avatarToModelTranslation));
}

// Debugging stuff.
var debugPrintCountdown = 2;
function debugPrint(object) { if (debugPrintCountdown > 0) { print(JSON.stringify(object)); debugPrintCountdown--; } }


var otherAvatar, otherAvatarHandJointIndex; // We don't need to update these during the shake.
var myAvatarHandJointIndex; // In case someone is shaking our hand without us having a controller.

function shakeHands(animationProperties) { // We are given an object with the animation variables that we registered for.

    // updateMyCoordinateSystem(); // For debugging, it may be convenient to allow the avatar to move aroun

    var yourCurrentTarget = animationProperties[animVarName] ||                            // model space
        worldToModel(MyAvatar.getJointPosition(myAvatarHandJointIndex)); // If no controller, do let our hand be shaken.
    var yourHandPosition = modelToWorld(yourCurrentTarget);                                // world space
    var otherAvatarHandPosition = otherAvatar.getJointPosition(otherAvatarHandJointIndex); // word space (just us again if no other avatar)
    var average = vectorAverage(otherAvatarHandPosition, yourHandPosition);                // world space
    var averageInModelSpace = worldToModel(average);                                       // model space
    // FIXME?: We might want a small offset towards model +x to account for the palm thickness.
    debugPrint({hand: yourCurrentTarget, hips: avatarToModelTranslation, world: yourHandPosition, other: otherAvatarHandPosition, average: average, target: averageInModelSpace});
    var result = {};   // Callback returns an object with properties that we want the animation system to use.
    result[animVarName] = averageInModelSpace;
    return result;
}

function startHandshake() {

    // Grab other avatar info:
    otherAvatar = findOtherAvatar();
    otherAvatarHandJointIndex = findJointIndex(otherAvatar, jointName);

    // Grab our info, assuming that the avatar doesn't move during the handshake:
    myAvatarHandJointIndex = findJointIndex(MyAvatar, jointName); // only used as a no-hydra fallback
    myHipsJointIndex = findJointIndex(MyAvatar, hipsName);
    updateMyCoordinateSystem();

    // Debug stuff:
    print("other avatar name:", otherAvatar.displayName,
          "other avatar hand index:", otherAvatarHandJointIndex,
          "other position:", JSON.stringify(otherAvatar.position),
          "my hand index:", myAvatarHandJointIndex);

    // Register averageHands with my avatar's animation system.
    MyAvatar.addAnimationStateHandler(shakeHands, [animVarName]); // The second argument is currently ignored.
}

function endHandshake() { MyAvatar.removeAnimationStateHandler(shakeHands); } // Tell the animation system we don't need any more callbacks.

Script.scriptEnding.connect(endHandshake);

if (hasHydra()) {
    var isOn = false;
    Script.update.connect(function () {
        if (Controller.getActionValue(Controller.findAction("RIGHT_HAND_CLICK"))) {
            if (!isOn) {
                isOn = true;
                startHandshake();
            }
        } else if (isOn) {
            isOn = false;
            endHandshake();
        }
    });
} else {
    startHandshake();
}
