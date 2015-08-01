// HRS:
//   Set http://howard-stearns.github.io/models/scripts/cell/showIdentification.js as the Script URL of a cube.
//   Drive within 2 m of the cube and see a button. Press the button and it plays a sound once. The button disappears immediately.
//   If you play, back up and return fast enough to make the button reappear, and press it while the sound is still playing,
//   you get two sounds overlapping.
(function(){
    var baseURL = "http://howard-stearns.github.io/models/"; //HRS
    var self = this;
    this.buttonImageURL = "http://s3.amazonaws.com/hifi-public/images/puck.png"; //HRS baseURL + "GUI/GUI_audio.png?"+version;
	this.soundPlaying=false;
    var version = 1;
    this.preload = function(entityId) {
        this.entityId = entityId;
        self.addButton();

//        this.buttonShowing = false;
        //this.labelShowing = false;
        self.getUserData();
        this.labelURL = "http://s3.amazonaws.com/hifi-public/images/billiardsReticle.png"; //HRS baseURL + "GUI/labels_" + self.userData.name + ".png?"+version;
        this.showDistance = self.userData.showDistance;
        this.soundURL = baseURL + "sounds/piano2.wav"; //HRS "Audio/" + self.userData.name + ".wav";
        print("distance = " + self.userData.showDistance + ", sound = " + this.soundURL);
        this.soundOptions = {stereo: true, loop: false, localOnly: true, volume: 1.0};
        this.sound = SoundCache.getSound(this.soundURL);
    }

    this.addButton = function() {
        this.windowDimensions = Controller.getViewportDimensions();
        this.buttonWidth = 100;
        this.buttonHeight = 100;
        this.buttonPadding = 0;

        this.buttonPositionX = (self.windowDimensions.x - self.buttonPadding)/2 - self.buttonWidth/2;
        this.buttonPositionY = (self.windowDimensions.y - self.buttonHeight) - (self.buttonHeight + self.buttonPadding);
        this.button = Overlays.addOverlay("image", {
            x: self.buttonPositionX,
            y: self.buttonPositionY,
            width: self.buttonWidth,
            height: self.buttonHeight,
            imageURL: self.buttonImageURL,
            visible: true, //HRS false,
            alpha: 1.0
        });

        this.labelWidth = 256;
        this.labelHeight = 64;
        this.labelPadding = 0;

        this.labelPositionX = (self.windowDimensions.x - self.labelPadding)/2 - self.labelWidth/2;
        this.labelPositionY = self.labelHeight + self.labelPadding;
        print("label is at " + this.labelPositionX + " : " + this.labelPositionY);
        this.label = Overlays.addOverlay("image", {
            x: self.labelPositionX,
            y: self.labelPositionY,
            width: self.labelWidth,
            height: self.labelHeight,
            imageURL: self.labelURL,
            visible: true, //HRS false,
            alpha: 1.0
        });
    }
//    this.addLabel = function() {
//        this.windowDimensions = Controller.getViewportDimensions();
//        this.labelWidth = 256;
//        this.labelHeight = 64;
//        this.labelPadding = 0;
//
//        this.labelPositionX = (self.windowDimensions.x - self.labelPadding)/2 - self.labelWidth;
//        this.labelPositionY = (self.windowDimensions.y - self.labelHeight) - (self.labelHeight + self.labelPadding);
//		print("label is at " + this.labelPositionX + " : " this.labelPositionY);
//        this.label = Overlays.addOverlay("image", {
//            x: self.labelPositionX,
//            y: self.labelPositionY,
//            width: self.labelWidth,
//            height: self.labelHeight,
//            imageURL: self.labelURL,
//            visible: false,
//            alpha: 1.0
//        });
//    }

    this.getUserData = function() {
        this.properties = Entities.getEntityProperties(this.entityId);
        print('getUserData ' + this.properties.userData);
        if (self.properties.userData) {
            this.userData = JSON.parse(this.properties.userData);
        } else {
            this.userData = {showDistance: 2}; // HRS {};
        }
    }

   // this.update = function(deltaTime) {

   //     self.distance = Vec3.distance(MyAvatar.position, Entities.getEntityProperties(self.entityId).position);
   //  	//print(self.distance);
   //     if (!self.buttonShowing && self.distance < self.userData.showDistance) {
   //         self.buttonShowing = true;
   //         Overlays.editOverlay(self.button, {
   //             visible: true
   //         });
   //     } else if (self.buttonShowing && self.distance > self.userData.showDistance) {
   //         self.buttonShowing = false;
   //         Overlays.editOverlay(self.button, {
   //             visible: false
   //         });
   //     }
   // }

    this.enterEntity = function(entityID) {

//		self.getUserData();
        print("entering entity and showing" + self.labelURL);
        //self.buttonShowing = true;
        Overlays.editOverlay(self.button, {
            visible: true
        });
        Overlays.editOverlay(self.label, {
            visible: true
        });
    }



    this.leaveEntity = function(entityID) {
//		self.getUserData();
//		print("leaving entity " + self.userData.name);
        //self.buttonShowing = false;
        print(Overlays);
         Overlays.editOverlay(self.button, {
                visible: false
         });
        Overlays.editOverlay(self.label, {
                visible: false
         });
    }

    this.onClick = function(event) {
        var clickedOverlay = Overlays.getOverlayAtPoint({
            x: event.x,
            y: event.y
        });
        if (clickedOverlay == self.button && self.soundPlaying == false) {
            print("button was clicked");
            if (self.sound.downloaded) {
                print("play sound");
				this.soundPlaying = true;
				 Overlays.editOverlay(self.button, {
					visible: false
				});
                Audio.playSound(self.sound, self.soundOptions);
            } else {
                print("not downloaded");
            }
        }
    }

    this.unload = function() {
        Overlays.editOverlay(self.button, {
            visible: false
        });
		self.soundPlaying = false;
        Controller.mousePressEvent.disconnect(this.onClick);
        //Script.update.disconnect(this.update);
    }

    Controller.mousePressEvent.connect(this.onClick);
    //Script.update.connect(this.update);

});
