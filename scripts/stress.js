"use strict";
/*jslint vars: true, plusplus: true*/
/*global Agent, Avatar, Script, Entities, print*/

Avatar.skeletonModelURL = "https://hifi-public.s3.amazonaws.com/marketplace/contents/ad0dffd7-f811-487b-a20a-2509235491ef/29106da1f7e6a42c7907603421fd7df5.fst?1441998287";
Avatar.displayName = "'Bot";
Agent.isAvatar = true;

var ready, runtime = 0.0, count = 0;
function update(deltaTime) {
    runtime += deltaTime;
    if (!ready && Entities.serversExist() && Entities.canRez()) { // FIXME: also test audio and avatar mixer.
        ready = true;
        return;
    }
    if (++count > (60 * 5)) {
        print('tick', runtime, Avatar.displayName, Avatar.sessionUUID, JSON.stringify(Avatar.position));
        count = 0;
    }
}
Script.setTimeout(function () { // until we can trust the update ready test for audio and avatar, just wait a while
    print('starting update');
    //FIXME Agent.isListeningToAudioStream = true;
    Avatar.scale = 1;
    Avatar.position = {x: 500, y: 502, z: 500};
    Script.update.connect(update);
}, 10000); 
print('end of script file');
