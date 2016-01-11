"use strict";
/*jslint nomen: true, plusplus: true, vars: true*/
var Entities, Script, print, Vec3;
//
//  Created by Philip Rosedale on July 28, 2015
//  Copyright 2015 High Fidelity, Inc.
//  
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
//  Creates a rectangular matrix of objects, starting at the origin plus Y_OFFSET.
//  Useful for testing the rendering, LOD, and octree storage aspects of the system.  
//
//  Note that when creating things quickly, the entity server will ignore data if we send updates too quickly.
//  like Internet MTU, these rates are set by th domain operator, so in this script there is a RATE_PER_SECOND 
//  variable letting you set this speed.  If entities are missing from the grid after a relog, this number 
//  being too high may be the reason. 

var SIZE = 1.0;
var SEPARATION = 10.0;
var ROWS_X = 20;
var ROWS_Y = 1;
var ROWS_Z = 20;
var LIFETIME = 30;
var TYPES_TO_USE = [ // Entities will be populated from this list set by the script writer for different tests.
    'Box',
    //'Sphere',
    //"https://hifi-content.s3.amazonaws.com/ozan/dev/sets/lowpoly_island/CypressTreeGroup.fbx",
    //"http://s3.amazonaws.com/hifi-public/marketplace/hificontent/Games/blocks/block.fbx",
];
var Y_OFFSET = 510;
var MODEL_SCALE = { x: 1, y: 2, z: 3 };
var RATE_PER_SECOND = 600;    //    The entity server will drop data if we create things too fast.
var SCRIPT_INTERVAL = 100;

var ALLOWED_TYPES = ['Box', 'Sphere']; // otherwise assumed to be a model url

var x = 0;
var y = 0;
var z = 0;
var totalCreated = 0;
var startTime = new Date();
var totalToCreate = ROWS_X * ROWS_Y * ROWS_Z;
print("Creating " + totalToCreate + " entities starting at " + startTime);

Script.setInterval(function () {
    if (!Entities.serversExist() || !Entities.canRez()) {
        return;
    }

    var numToCreate = Math.min(RATE_PER_SECOND * (SCRIPT_INTERVAL / 1000.0), totalToCreate - totalCreated);
    var chooseTypeRandomly = TYPES_TO_USE.length !== 2;
    var i, typeIndex, type, isModel, properties;
    for (i = 0; i < numToCreate; i++) {
        typeIndex = chooseTypeRandomly ? Math.floor(Math.random() * TYPES_TO_USE.length) : i % TYPES_TO_USE.length;
        type = TYPES_TO_USE[typeIndex];
        isModel = ALLOWED_TYPES.indexOf(type) === -1;
        properties = {
            position: { x: SIZE + (x * SEPARATION), y: SIZE + (y * SEPARATION) + Y_OFFSET, z: SIZE + (z * SEPARATION) },
            name: "gridTest",
            type: isModel ? 'Model' : type,
            dimensions: isModel ? Vec3.multiply(SIZE, MODEL_SCALE) : { x: SIZE, y: SIZE, z: SIZE },
            ignoreCollisions: false,
            collisionsWillMove: true,
	    gravity: { x: 0, y: -9.8, z: 0 },
	    velocity: { x: 0, y: 0.1, z: 0},
            lifetime: LIFETIME
        };
        if (isModel) {
            properties.modelURL = type;
        } else {
            properties.color = { red: x / ROWS_X * 255, green: y / ROWS_Y * 255, blue: z / ROWS_Z * 255 };
        }
        Entities.addEntity(properties);
        totalCreated++;

        x++;
        if (x === ROWS_X) {
            x = 0;
            y++;
            if (y === ROWS_Y) {
                y = 0;
                z++;
                print("Created: " + totalCreated);
            }
        }
        if (z === ROWS_Z) {
            print("Total: " + totalCreated + " entities in " + ((new Date() - startTime) / 1000.0) + " seconds.");
	    var confirmation = Entities.findEntities(MyAvatar.position, 32768);
	    print("N found entities = " + confirmation.length);
            Script.stop();
        }
    }
}, SCRIPT_INTERVAL);

