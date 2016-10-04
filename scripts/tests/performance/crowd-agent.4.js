"use strict";
/*jslint vars: true, plusplus: true*/
/*global Agent, Avatar, Script, Entities, Vec3, Quat, print*/
//
//  crowd-agent.js
//  scripts/developer/tests/performance/
//
//  Created by Howard Stearns on 9/29/16.
//  Copyright 2016 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
//  Add this to domain-settings scripts url with n instances. It will lie dormant until
//  a script like summon.js calls up to n avatars to be around you.

var MESSAGE_CHANNEL = "io.highfidelity.summon-crowd";

print('crowd-agent version 4');

/* Observations:
- File urls for AC scripts silently fail. Use a local server (e.g., python SimpleHTTPServer) for development.
- URLs are cached regardless of server headers. Must use cache-defeating query parameters.
- JSON.stringify(Avatar) silently fails (even when Agent.isAvatar)
*/

function printAvatar(label) {
    print('avatar', label, Agent.sessionUUID, JSON.stringify({id: Avatar.sessionUUID, position: Avatar.position, orientation: Avatar.orientation, skeletonModelURL: Avatar.skeletonModelURL}));
}

function startAgent(parameters) { // Can also be used to update.
    print('crowd-agent starting params', JSON.stringify(parameters), JSON.stringify(Agent));
    Agent.isAvatar = true;    
    printAvatar('before');
    Avatar.setSessionUUID(Agent.sessionUUID);
    printAvatar('session');
    if (parameters.position) {
        Avatar.position = parameters.position;
    }
    printAvatar('position');
    if (parameters.orientation) {
        Avatar.orientation = parameters.orientation;
    }
    printAvatar('orientation');
    if (parameters.skeletonModelURL) {
        Avatar.skeletonModelURL = parameters.skeletonModelURL;
    }
    printAvatar('skeleton');
    if (parameters.animationData) {
        data = parameters.animationData;
        Avatar.startAnimation(data.url, data.fps || 30, 1.0, (data.loopFlag === undefined) ? true : data.loopFlag, false, data.startFrame || 0, data.endFrame);
    }
    printAvatar('animation');
    print('crowd-agent avatars started');
}
function stopAgent(parameters) {
    Agent.isAvatar = false;
    printAvatar('stopped');
    Avatar.setSessionUUID(null);
    printAvatar('unset');
    print('crowd-agent stopped', JSON.stringify(parameters), JSON.stringify(Agent));
}

function messageSend(message) {
    Messages.sendMessage(MESSAGE_CHANNEL, JSON.stringify(message));
}
function messageHandler(channel, messageString, senderID) {
    if (channel !== MESSAGE_CHANNEL) {
        return;
    }
    print('crowd-agent message', channel, messageString, senderID);
    if (Agent.sessionUUID === senderID) { // ignore my own
        return;
    }
    var message = {};
    try {
        message = JSON.parse(messageString);
    } catch (e) {
        print(e);
    }
    switch (message.key) {
    case "HELO":
        messageSend({key: 'hello'}); // Allow the coordinator to count responses and make assignments.
        break;
    case 'hello': // ignore responses (e.g., from other agents)
        break;
    case "SUMMON":
        if (message.rcpt === Agent.sessionUUID) {
            startAgent(message);
        }
        break;
    case "STOP":
        if (message.rcpt === Agent.sessionUUID) {
            stopAgent(message);
        }
        break;
    default:
        print("crowd-agent received unrecognized message:", channel, messageString, senderID);
    }
}
Messages.subscribe(MESSAGE_CHANNEL);
Messages.messageReceived.connect(messageHandler);

Script.scriptEnding.connect(function () {
    print('crowd-agent shutting down');
    Messages.messageReceived.disconnect(messageHandler);
    Messages.unsubscribe(MESSAGE_CHANNEL);
    print('crowd-agent unsubscribed');
});
