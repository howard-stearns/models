"use strict";
/*jslint nomen: true, plusplus: true, vars: true*/
var Vec3, Quat, MyAvatar, Entities, Camera, Script, print;
//
//  Created by Philip Rosedale on January 9, 2016
//  Copyright 2015 High Fidelity, Inc.
//  
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
//  Puts a bunch of entities in front of you, with various adjustable properties for testing.
//
//  Note that when creating things quickly, the entity server will ignore data if we send updates too quickly.
//  like Internet MTU, these rates are set by th domain operator, so in this script there is a RATE_PER_SECOND 
//  variable letting you set this speed.  If entities are missing from the grid after a relog, this number 
//  being too high may be the reason. 

var SIZE = 0.5;
var TYPE = "Sphere";            //   Right now this can be "Box" or "Model" or "Sphere"
var MODEL_URL = "http://s3.amazonaws.com/hifi-public/models/content/basketball2.fbx";
var MODEL_DIMENSION = { x: 0.3, y: 0.3, z: 0.3 };

var RATE_PER_SECOND = 600;    //    The entity server will drop data if we create things too fast.
var SCRIPT_INTERVAL = 100;
var LIFETIME = 60;

var NUMBER_TO_CREATE = 3;

var GRAVITY = { x: 0, y: -9.8, z: 0 };
var VELOCITY = { x: 0.0, y: 0, z: 0 };
var ANGULAR_VELOCITY = { x: 1, y: 1, z: 1 };

var DAMPING = 0.5;
var ANGULAR_DAMPING = 0.5;

var collidable = true;
var gravity = true;


var x = 0;
var z = 0;
var totalCreated = 0;

var RANGE = 3;
var HOW_FAR_IN_FRONT_OF_ME = RANGE * 3;
var HOW_FAR_UP = RANGE / 3;


var offset = Vec3.sum(Vec3.multiply(HOW_FAR_UP, Vec3.UNIT_Y),
                      Vec3.multiply(HOW_FAR_IN_FRONT_OF_ME, Quat.getFront(Camera.orientation)));
var center = Vec3.sum(MyAvatar.position, offset);


function randomVector(range) {
    return {
        x: (Math.random() -  0.5) * range.x,
        y: (Math.random() -  0.5) * range.y,
        z: (Math.random() -  0.5) * range.z
    };
}

Vec3.print("Center: ", center);

Script.setInterval(function () {
    if (!Entities.serversExist() || !Entities.canRez()) {
        return;
    }
    if (totalCreated >= NUMBER_TO_CREATE) {
        print("Created " + totalCreated + " tribbles.");
        Script.stop();
    }

    var i, position, numToCreate = RATE_PER_SECOND * (SCRIPT_INTERVAL / 1000.0);
    for (i = 0; (i < numToCreate) && (totalCreated < NUMBER_TO_CREATE); i++) {
        position = Vec3.sum(center, randomVector({ x: RANGE, y: RANGE, z: RANGE }));

        Vec3.print("Position: ", position);
        Entities.addEntity({
            type: TYPE,
            modelURL: MODEL_URL,
            name: "tribble-" + totalCreated,
            position: position,
            dimensions: (TYPE === "Model") ? MODEL_DIMENSION : { x: SIZE, y: SIZE, z: SIZE },
            color: { red: Math.random() * 255, green: Math.random() * 255, blue: Math.random() * 255 },
            velocity: VELOCITY,
            angularVelocity: Vec3.multiply(Math.random(), ANGULAR_VELOCITY),
            damping: DAMPING,
            angularDamping: ANGULAR_DAMPING,
            gravity: (gravity ? GRAVITY : { x: 0, y: 0, z: 0}),
            collisionsWillMove: collidable,
            lifetime: LIFETIME,
            script: "file:///Users/howardstearns/models/scripts/load/entityScriptTribble.js"
        });

        totalCreated++;
    }
}, SCRIPT_INTERVAL);

