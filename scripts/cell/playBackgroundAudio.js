(function() {
    var baseURL = "http://howard-stearns.github.io/models/"; // HRS"http://dynamoidapps.com/HighFidelity/Cosm/";
    var self = this;

    var version = 2;
    this.preload = function(entityId) {
        self.soundPlaying = false;
        self.entityId = entityId;
        self.getUserData();
        self.soundURL = baseURL +  "sounds/piano2.wav"; //HRS "Audio/" + self.userData.name + ".wav";
        self.soundOptions = {
            stereo: true,
            loop: true,
            localOnly: false, // HRS true,
            position: MyAvatar.position, // HRS, to go with non-local
            volume: 0.2
        };
        self.sound = SoundCache.getSound(self.soundURL);



    }

    //    this.update = function(){
    //         if (self.sound.downloaded && !playing) {
    //            print("play sound");
    //             playing=true;
    //            Audio.playSound(self.sound, self.soundOptions);
    //        }
    //    }


    this.getUserData = function() {
        self.properties = Entities.getEntityProperties(self.entityId);
        if (self.properties.userData) {
            self.userData = JSON.parse(this.properties.userData);
        } else {
            self.userData = {};
        }
    }

    //      Script.update.connect(this.update);


    this.enterEntity = function(entityID) {
        print("entering audio zone");
        if (self.sound.downloaded) {
            print("play sound");
            self.soundPlaying = Audio.playSound(self.sound, self.soundOptions);

        } else {
            print("not downloaded");
        }
    }
    this.clickReleaseOnEntity = function(entityID, mouseEvent) { // HRS
        print('click release on ' + entityID);
    };


    this.leaveEntity = function(entityID) {
        print("leaving audio area " + self.userData.name);
        if (self.soundPlaying != null) {
            print("not null");
            print("Stopped sound " + self.userData.name);
            self.soundPlaying.stop();
        } else {
            print("Sound not playing");
        }
    }



});
