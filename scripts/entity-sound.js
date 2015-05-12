(function(){ 

    var cachedSound = SoundCache.getSound("http://s3.amazonaws.com/hifi-public/sounds/claps/BClap1Rvb.wav");
    var injector;

    this.collisionWithEntity = function (entityID, otherID, collision) {
	if (!cachedSound.downloaded) {
	    print("Sound not ready yet.");
	    return;
	}
	if (injector && injector.isPlaying) {
	    return;
	}
	var properties = Entities.getEntityProperties(entityID);
	
	/* simulatorID is the node id of physics simulator for this entity. 
	   Note that both ids here can change at any time. */
	if (properties.simulatorID != MyAvatar.sessionUUID.slice(1, -1).toUpperCase()) {
	    return;
	}
	var spec = {
            position: properties.position,
            volume: 1.0
	};
	injector = Audio.playSound(cachedSound, spec);
    };
})
