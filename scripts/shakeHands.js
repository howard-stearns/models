"use strict";
/*jslint vars: true*/
var AvatarList, MyAvatar, Script, Vec3, Quat; // Declare globals so that jslint does not complain.
// Prototype and testbed for two avatars shaking hands.

// This current version is just the basics: as long as the script is running, it will try to average your hand position with that of the first other avatar it finds.
// I.e., there is no stop/start other than starting/stopping the script.
// Requires:
// - https://github.com/highfidelity/hifi/pull/6097;
// - Developer->Avatars->Enable Anim Graph on.
// - Your right hydra must be in use (and off-hook).
// - If you want the other avatar to also move it's hand, it needs to ALSO run this script on its own Interface, with the same requirements.

var jointName = 'RightHand'; // Actually, this should be computed for each avatar, using the best match from thatAvatar.jointNames();

var allAvatarIdsIncludingYours = AvatarList.getAvatars(); // Yours has null id
var theFirstAvatarIdNotYou = allAvatarIdsIncludingYours[0] || allAvatarIdsIncludingYours[1];
var otherAvatar = AvatarList.getAvatar(theFirstAvatarIdNotYou);
var otherAvatarHandJointIndex = otherAvatar.getJointIndex('RightHand');

// Assuming that the avatar doesn't move during the handshake:
var myTranslation = MyAvatar.position;
var myRotation = MyAvatar.orientation;
var myInverse = Quat.inverse(myRotation);

function vectorAverage(point1, point2) { return Vec3.multiply(0.5, Vec3.sum(point1, point2)); }
function modelToWorld(modelPoint) { return Vec3.sum(myTranslation, Vec3.multiplyQbyV(myRotation, modelPoint)); }
function worldToModel(worldPoint) { return Vec3.multiplyQbyV(myInverse, Vec3.subtract(worldPoint, myTranslation)); }

function averageHands(animationProperties) { // We are given an object with the animation variables that we registered for.
    var yourCurrentTarget = animationProperties.rightHandPosition; // Can be falsey if our hydra is not in use
    if (!yourCurrentTarget) {
        return {};
    }
    var yourHandPosition = modelToWorld(yourCurrentTarget); // animationProperties uses model space
    var otherAvatarHandPosition = otherAvatar.getJointPosition(otherAvatarHandJointIndex); // word space
    var average = vectorAverage(otherAvatarHandPosition, yourHandPosition);
    // We must return an object with the properties that we want the animation system to use.
    return {rightHandPosition: worldToModel(average)};
}

function clear() { MyAvatar.removeAnimationStateHandler(averageHands); } // Tell the animation system we don't need any more callbacks.

// Register averageHands with my avatar's animation system.
MyAvatar.addAnimationStateHandler(averageHands, ['rightHandPosition']); // The second argument is currently ignored.

Script.scriptEnding.connect(clear);
