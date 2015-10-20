"use strict";
/*jslint vars: true*/
var AvatarList, MyAvatar, Script, Vec3, Quat, print; // Declare globals so that jslint does not complain.
// Prototype and testbed for two avatars shaking hands.

// This current version is just the basics: as long as the script is running, it will try to average your hand position with that of the first other avatar it finds.
// I.e., there is no stop/start other than starting/stopping the script.
// Requires:
// - https://github.com/highfidelity/hifi/pull/6097;
// - Developer->Avatars->Enable Anim Graph on.
// - Your right hydra must be in use (and off-hook).
// - If you want the other avatar to also move it's hand, it needs to ALSO run this script on its own Interface, with the same requirements.

var jointName = 'RightHand'; // Actually, this should be computed for each avatar, using the best match from thatAvatar.jointNames();
var hipsName = 'Hips';

var allAvatarIdsIncludingYours = AvatarList.getAvatars(); // Yours has null id
var theFirstAvatarIdNotYou = null; //FIXME after debugging allAvatarIdsIncludingYours[0] || allAvatarIdsIncludingYours[1];
// A pun for debugging: If there are no other avatars, the otherAvatar is you! (That's how getAvatar("junkId") works.)
// In that case, this script should end up averaging yourself with (previous frame of) yourself.
var otherAvatar = AvatarList.getAvatar(theFirstAvatarIdNotYou);
var otherAvatarHandJointIndex = otherAvatar.getJointIndex(jointName);

// Assuming that the avatar doesn't move during the handshake:
var myHipsJointIndex = MyAvatar.getJointIndex(hipsName);
var avatarToWorldTranslation = MyAvatar.position;
var avatarToWorldRotation = MyAvatar.orientation;
var worldToAvatarRotation = Quat.inverse(avatarToWorldRotation);
var modelToAvatarRotation = Quat.angleAxis(180, {x: 0, y: 1, z: 0});
var avatarToModelRotation = Quat.inverse(modelToAvatarRotation); // Flip 180 gives same result without inverse, but being explicit to track the math.
var avatarHipsTranslation = {"x": 0.00003611063220887445, "y": 1.014387607574463, "z": 0.008376987650990486}; // harcoded for Kate for debugging
//var avatarHipsTranslation = MyAvatar.getJointTranslation(myHipsJointIndex); // should really be done on the bind pose

function vectorAverage(point1, point2) { return Vec3.multiply(0.5, Vec3.sum(point1, point2)); }
function modelToWorld(modelPoint, avatarToModelTranslation) {
    var avatar = Vec3.subtract(Vec3.multiplyQbyV(modelToAvatarRotation, modelPoint), avatarToModelTranslation);
    return Vec3.sum(Vec3.multiplyQbyV(avatarToWorldRotation, avatar), avatarToWorldTranslation);
}
function worldToModel(worldPoint, avatarToModelTranslation) {
    var avatar = Vec3.multiplyQbyV(worldToAvatarRotation, Vec3.subtract(worldPoint, avatarToWorldTranslation));
    return Vec3.multiplyQbyV(avatarToModelRotation, Vec3.sum(avatar, avatarToModelTranslation));
}

var initialHandPositionForDebugging = worldToModel(MyAvatar.getJointPosition(otherAvatarHandJointIndex), avatarHipsTranslation);
function averageHands(animationProperties) { // We are given an object with the animation variables that we registered for.
    var yourCurrentTarget = animationProperties.rightHandPosition; // Can be falsey if our hydra is not in use
    if (!yourCurrentTarget) {
        yourCurrentTarget = initialHandPositionForDebugging; // For debugging, it can be convenient to not bail on the next line and instead set this.
        //return {};
    }
    var yourHandPosition = modelToWorld(yourCurrentTarget, avatarHipsTranslation); // animationProperties uses model space
    var otherAvatarHandPosition = otherAvatar.getJointPosition(otherAvatarHandJointIndex); // word space
    var average = vectorAverage(otherAvatarHandPosition, yourHandPosition);
    var averageInModelSpace = worldToModel(average, avatarHipsTranslation);
    print(JSON.stringify({hand: yourCurrentTarget, hips: avatarHipsTranslation, world: yourHandPosition, other: otherAvatarHandPosition, average: average, target: averageInModelSpace}));
    return {rightHandPosition: averageInModelSpace}; // Callback returns an object with properties that we want the animation system to use.
}

function clear() { MyAvatar.removeAnimationStateHandler(averageHands); } // Tell the animation system we don't need any more callbacks.

// Register averageHands with my avatar's animation system.
MyAvatar.addAnimationStateHandler(averageHands, ['rightHandPosition']); // The second argument is currently ignored.

Script.scriptEnding.connect(clear);

//---------- debug junk ---------//
function reflectw(model) {
    var avatar = Vec3.subtract(Vec3.multiplyQbyV(modelToAvatarRotation, model), avatarHipsTranslation);
    var world = Vec3.sum(Vec3.multiplyQbyV(avatarToWorldRotation, avatar), avatarToWorldTranslation);
    var avatar2 = Vec3.multiplyQbyV(worldToAvatarRotation, Vec3.subtract(world, avatarToWorldTranslation));
    return [model, world, Vec3.multiplyQbyV(avatarToModelRotation, Vec3.sum(avatar2, avatarHipsTranslation))];
}
var model = {x: -0.25, y: 0.95, z: 0};
JSON.stringify(reflectw(model));
