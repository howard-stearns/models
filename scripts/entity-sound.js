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

	/* Temoprary Hack: There isn't yet any MyNodeID property. For now, we just set it. */
	if (!GlobalServices.MyNodeID) GlobalServices.MyNodeID = properties.simulatorID;
	
	/* simulatorID is the node id of physics simulator for this entity. */
	if (properties.simulatorID != GlobalServices.MyNodeID) {
	    return;
	}
	var spec = {
            position: properties.position,
            volume: 1.0
	};
	injector = Audio.playSound(cachedSound, spec);
    };
})
