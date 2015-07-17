"use strict";
/*jslint vars: true*/
var Entities, MyAvatar;
var sphere = Entities.addEntity({type: 'Sphere', position: MyAvatar.position, dimensions: {x: 0.1, y: 0.1, z: 0.1}, color: {red: 255, green: 0, blue: 0}});
var box = Entities.addEntity({type: 'Box', position: MyAvatar.position, dimensions: {x: 0.1, y: 0.1, z: 0.1}, color: {red: 0, green: 255, blue: 0}});
