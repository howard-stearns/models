"use strict";
var AvatarList, MyAvatar, Script, Vec3; // Declare globals so that jslint does not complain.
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

function vectorAverage(a, b) { return Vec3.multiply(0.5, Vec3.sum(a, b)); }

function averageHands(animationProperties) { // We are given an object with the animation variables that we registered for.
    var otherAvatarHandPosition = otherAvatar.getJointPosition(otherAvatarHandJointIndex),
        yourCurrentTarget = animationProperties.rightHandPosition, // Can be falsey if our hydra is not in use
        average = vectorAverage(yourCurrentTarget, otherAvatarHandPosition);
    return !yourCurrentTarget ? {} : {rightHandPosition: average}; // We must return an object with the properties that we want the animation system to use.
}

function clear() { MyAvatar.removeAnimationStateHandler(averageHands); } // Tell the animation system we don't need any more callbacks.

// Register averageHands with my avatar's animation system.
MyAvatar.addAnimationStateHandler(averageHands, ['rightHandPosition']); // The second argument is currently ignored.

Script.scriptEnding.connect(clear);
