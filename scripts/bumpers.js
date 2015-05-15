(function(){
    var glowLevel = 0, id;
    /* Set the color beforehand in the proper editor or a script */
    
    function animate() {
	var change = {};
	if (!glowLevel) {
	    change.visible = true;
	    glowLevel = 1;
	} else {
	    glowLevel = glowLevel - 0.05;
	    if (glowLevel <= 0) {
		change.visible = false;
		glowLevel = 0;
	    }
	}
	/* If we did alpha, I would set alpha to glowLevel here. */
	change.glowLevel = glowLevel;
	Entities.editEntity(id, change);
	if (glowLevel > 0) {
	    Script.setTimeout(animate, 100);
	}
    }

    this.collisionWithEntity = function (entityID, otherID, collision) {
	if (collision.type !== 0) { /* 0 is start of collisions */
	    return;
	}
	
	var properties = Entities.getEntityProperties(entityID);
	if (properties.simulatorID != MyAvatar.sessionUUID.slice(1, -1).toUpperCase()) {
	    return;
	}

	id = entityID; /* so setTimeout can operate without an argument */
	Script.setTimeout(animate, 0);
    };
})
