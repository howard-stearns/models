"use strict";
/*jslint nomen: true, plusplus: true, vars: true*/
(function() {
    function update() {
	print('hi');
    }
    this.preload = function (entityID) { 
	Script.update.connect(update);
    };
})
