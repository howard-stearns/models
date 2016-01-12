"use strict";
/*jslint nomen: true, plusplus: true, vars: true*/
(function() {
    function update() {
	print('hi');
    }
    this.preload = function (entityID) { 
	Script.update.connect(update);
    };
    this.unload = function () {
        print('** unload');
        Script.update.disconnect(update);
    };
})
