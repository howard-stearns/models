(function(){ 

    this.collisionWithEntity = function (entityID, otherID, collision) {
	var properties = Entities.getEntityProperties(entityID);
	
	/* simulatorID is the node id of physics simulator for this entity. 
	   Note that both ids here can change at any time. */
	if (properties.simulatorID != MyAvatar.sessionUUID.slice(1, -1).toUpperCase()) {
	    return;
	}
	print("ENTITY PROPERTIES: " + JSON.stringify(properties));
    };
})
