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
    var isPlaying = false; /* I'd rather have overlapping sounds, but let's get everything else working first. */
    function playCollisionSound(entityId, otherId, collision) {
	/* If we want, this could also have an isPlaying guard... */
	if (!cachedSound.downloaded) { print("Sound not ready yet."); return; }
	if (isPlaying) { return; }
	isPlaying = true;
	print('collision start ' + entityId.id);
	/* We really want the following, and then to have spec refer to
	   properties.postion and properties.collisionSoundVolume || volume.
	   Alas, getEntitiesProperties tries to obtain a lock on the entity,
	   and can deadlock. Very bad. So the code below cheats instead.
	   var properties = Entities.getEntityProperties(entityId);
	*/
	var spec = {
            position: MyAvatar.position, /* properties.position,*/
            volume: /*properties.collisionSoundVolume || */volume
	};
	Audio.playSound(cachedSound, spec);
	print('collision end ' + entityId.id);
	isPlaying = false;
    }
    this.collisionWithEntity = playCollisionSound;
})
