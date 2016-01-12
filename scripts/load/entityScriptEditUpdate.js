"use strict";
/*jslint nomen: true, plusplus: true, vars: true*/
(function() {
    var accumulated = 0, oldColor, entityId;
    function update(delta) {
	accumulated += delta;
	if (accumulated > 5) {
	    var newColor = {red: oldColor.green, green: oldColor.blue, blue: oldColor.red};
	    oldColor = newColor;
	    Entities.editEntity(entityId, {color: newColor});
	    accumulated = 0;
	}
    }
    this.preload = function (givenEntityID) {
	entityId = givenEntityId;
	oldColor = Entities.getEntityProperties(entityID).color;
	Script.update.connect(update);
    };
    this.unload = function () {
        Script.update.disconnect(update);
    };
})
