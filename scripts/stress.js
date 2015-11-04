"use strict";
/*jslint vars: true, plusplus: true*/
/*global Agent, Avatar, Script, print*/

Avatar.skeletonModelURL = "https://hifi-public.s3.amazonaws.com/marketplace/contents/ad0dffd7-f811-487b-a20a-2509235491ef/29106da1f7e6a42c7907603421fd7df5.fst?1441998287";
Avatar.displayName = "'Bot";
Avatar.position = {x: 500, y: 502, z: 500};
Agent.isAvatar = true;
//Agent.isListeningToAudioStream = true;

var runtime = 0.0, count = 0;
function update(deltaTime) {
    runtime += deltaTime;
    if (++count > 60) {
	print('tick', runtime);
	count = 0;
    }
}
print('start stress');
print('Agent', JSON.stringify(Agent));
print('Avatar', JSON.stringify(Avatar));
/*print('Script', JSON.stringify(Script));
Script.setTimeout(function () {
    print('starting update');
    Script.update.connect(update);
}, 10000);*/
