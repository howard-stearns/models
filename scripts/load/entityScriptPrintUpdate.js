"use strict";
/*jslint nomen: true, plusplus: true, vars: true*/
(function() {
    var accumulated = 0;
    function update(delta) {
	acummulated += delta;
	if (accumulated > 5) {
	    print('hi');
	    accumulated = 0;
	}
    }
    this.preload = function (entityID) { 
	Script.update.connect(update);
    };
    this.unload = function () {
        Script.update.disconnect(update);
    };
})
