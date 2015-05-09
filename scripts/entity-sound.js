(function(){ 
    /* What we really want is to be able to have interface make use of the following,
     * whether set in a script or in the entity property editor:
     */
    var HIFI_PUBLIC_BUCKET = "http://s3.amazonaws.com/hifi-public/";  /* Shouldn't this be global script property? */
    this.collisionSoundUrl = HIFI_PUBLIC_BUCKET + "sounds/claps/BClap1Rvb.wav";
    this.collisionSoundVolume = 0.8;

    /* We'd like for the above to be enough to trigger the following behavior automatically.
     * In the mean time, application writers can do the following themselves:
     */
    var cachedSound = SoundCache.getSound(this.collisionSoundUrl);
    var volume = this.collisionSoundVolume; /* because it's not really a property yet */
    function playCollisionSound(entityId, otherId, collision) {
	/* If we want, this could also have an isPlaying guard... */
	if (!cachedSound.downloaded) { print("Sound not ready yet."); return; }
	print('collision start ' + entityId.id);
	var properties = Entities.getEntityProperties(entityId);
	var spec = {
            position: properties.position,
            volume: properties.collisionSoundvolume || volume
	};
	Audio.playSound(cachedSound, spec);
	print('collision end ' + entityId.id);
    }
    this.collisionWithEntity = playCollisionSound;
})
