"use strict";
(function () {
    var that = this;
    var resolution = 1024;
    var portalOverlayOffset = 0.01;
    var spectatorCameraConfig = Render.getConfig("SecondaryCamera");
    var portalOverlayID;
    var portalIsOpen = false;
    var cachedUserData = null; // Not default userData value.
    var farData = null;
    var LOCAL_MESSAGE_TIME_ALLOWANCE = 500; //ms
    var MESSAGE_CHANNEL = "com.highfidelity.portal";
    var HIFI_URL_REGEX = /^(?:hifi:\/\/)?([\w-]+)?(?:\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?))?)?$/;
    var ENTITY_ID_REGEX = /^{/;

    function getGeometry(id) {
        return Entities.getEntityProperties(id || that.entityID, ["dimensions", "position", "rotation", "userData"]);
    }
    function localToWorld(localOffset, framePosition, frameOrientation) {
        var worldOffset = Vec3.multiplyQbyV(frameOrientation, localOffset);
        return Vec3.sum(framePosition, worldOffset);
    }
    function worldToLocal(worldPosition, framePosition, frameOrientation, optionalInverseFrameOrientation) {
        var inverseFrameOrientation = optionalInverseFrameOrientation || Quat.inverse(frameOrientation);
        var worldOffset = Vec3.subtract(worldPosition, framePosition);
        return Vec3.multiplyQbyV(inverseFrameOrientation, worldOffset);
    }
    function updateInternalProperties(geometry) {
        // IF the farID or farURL "properties" (in userData) have changed, update our parsed/defaulted farData.
        var userData = geometry.userData;
        if (cachedUserData === userData) { return; }

        var parsed = userData ? JSON.parse(userData) : {};
        cachedUserData = userData;
        farData = parsed.farID;
        if (farData) {  // entity id (in the far domain) or the labels "mirror" or "window".
            return;
        }
        var url = parsed.farURL || "";
        var parsedURL = url.match(HIFI_URL_REGEX);
        print('hrs url', url, HIFI_URL_REGEX, JSON.stringify(parsedURL));
        if (parsedURL[2]) { // The farURL specifies at least a position.
            farData = {
                position: {
                    x: parseFloat(parsedURL[2]),
                    y: parseFloat(parsedURL[3]),
                    z: parseFloat(parsedURL[4])
                },
                rotation: {
                    x: parseFloat(parsedURL[5] || "0"),
                    y: parseFloat(parsedURL[6] || "0"),
                    z: parseFloat(parsedURL[7] || "0"),
                    w: parseFloat(parsedURL[8] || "1")
                }
            };
            print('hrs static', JSON.stringify(farData));
        } else { // Default empty data to be a window. Useful for debugging the visual effect.
            farData = "window";
        }
    }

    function updateSpectatorCamera() {
        if (!portalIsOpen) { return; }
        var geometry = getGeometry();
        if (!geometry) { return closePortal(); } // e.g., a bogus entityID after deletion.
        updateInternalProperties(geometry);
        var thickness = geometry.dimensions.z / 2 + portalOverlayOffset;
        var id = null;
        var position, orientation;

        // Determine what id we're looking at, if any.
        if (farData === "mirror") {
            id = that.entityID;
        } else if (farData === "window") {
            id = that.entityID;
        } else if (typeof(farData) === 'string') { // an entity id
            id = farData;
        }

        // Unless we're mirror (which is adequately done by SecondaryCameraJob),
        // get the shared position/orientation that is the same for everyone,
        // and adjust it based on where this client's camera is.
        if (farData == "mirror") {
            spectatorCameraConfig.attachedEntityId = id;
            spectatorCameraConfig.mirrorProjection = true;
        } else {
            spectatorCameraConfig.attachedEntityId = null;
            spectatorCameraConfig.mirrorProjection = false;
            if (id) { // Position/orientation starts with the object's properties.
                var data = (id === that.entityID) ? geometry : getGeometry(id);
                position = data.position;
                orientation = data.rotation;
                // If you set a camera to an object's rotation, the camera will point from
                // the front of the object towards the back, along negative Z.
                // That is only what we want for a "window". Otherwise, rotate around local Y.
                if (farData != "window") { 
                    orientation = Quat.multiply(orientation, Quat.fromPitchYawRollDegrees(0,180,0));
                }
            } else { // Position/orientation starts with what was parsed from farURL.
                position = farData.position;
                orientation = farData.rotation;
            }

            // Now adjust for the camera's relationship to the near portal.
            var nearCamera = Camera.getPosition();
            var localCameraVector = worldToLocal(nearCamera, geometry.position, geometry.rotation);
            // With this flat projection that might not be perpendicular to our near camera, it's
            // REALLY hard to get that math right so that, e.g., a "window" would look the same with
            // or without the portal. Instead, we're taking an approximation that will look correct in
            // size only when the portal exactly fills the Interface window from edge to edge, top to bottom.
            // If we're closer to the portal surface, the image will be too big, and if farther from the portal,
            // the image will be too small.
            localCameraVector.z = 0; // Keep it in plane of camera, else you get a double size effect closer/farther.
            var farCameraPosition = localToWorld(localCameraVector, position, orientation);
            spectatorCameraConfig.position = farCameraPosition;
            spectatorCameraConfig.orientation = orientation;
            print('hrs dynamic', JSON.stringify(farData), JSON.stringify(spectatorCameraConfig.position), JSON.stringify(spectatorCameraConfig.orientation));
        }
        spectatorCameraConfig.nearClipPlaneDistance = thickness;
        spectatorCameraConfig.vFoV = Camera.frustum.fieldOfView;
    }

    function openPortal() {
        print('openPortal', that.entityID, 'was', portalIsOpen);
        if (portalIsOpen) { return; }
        print('openPortal is sending close message', that.entityID);
        Messages.sendMessage(MESSAGE_CHANNEL, 
                             JSON.stringify({method: 'close', opening: that.entityID}));
        Script.setTimeout(function () {
            var geometry = getGeometry();
            var dimX = geometry.dimensions.x;
            var dimY = geometry.dimensions.y;
            var dimZ = geometry.dimensions.z;
            updateInternalProperties(geometry);
            portalOverlayID = Overlays.addOverlay("image3d", {
                name: "portalOverlay",
                url: "resource://spectatorCameraFrame",
                emissive: true,
                parentID: that.entityID,
                alpha: 1,
                localRotation: (farData === "mirror") ? Quat.IDENTITY : Quat.fromPitchYawRollDegrees(0,180,0),
                localPosition: { x: 0, y: 0, z: dimZ/2 + portalOverlayOffset },
                dimensions: {
                    x: -(dimY > dimX ? dimY : dimX),
                    y: -(dimY > dimX ? dimY : dimX),
                    z: 0
                }
            });
            spectatorCameraConfig.resetSizeSpectatorCamera(dimX * resolution, dimY * resolution);

            Script.update.connect(updateSpectatorCamera);
            spectatorCameraConfig.enableSecondaryCameraRenderConfigs(true);
            portalIsOpen = true;
        }, LOCAL_MESSAGE_TIME_ALLOWANCE);
    }

    function closePortal() {
        print('closePortal', that.entityID, 'was', portalIsOpen);
        if (!portalIsOpen) { return; }
        Script.update.disconnect(updateSpectatorCamera);
        spectatorCameraConfig.enableSecondaryCameraRenderConfigs(false);
        Overlays.deleteOverlay(portalOverlayID);
        portalOverlayID = null;
        portalIsOpen = false;
    }

    that.clickReleaseOnEntity = function (entityID, data) {
        print('clickReleaseOnEntity', entityID, portalIsOpen);
        if (portalIsOpen) {
            closePortal();
        } else {
            openPortal();
        }
    };

    that.enterEntity = function (entityID) {
        // Note that if the portal is too thin, you can drive right through and miss
        // the event. 
        print('enterEntity', entityID, portalIsOpen);
        if (!portalIsOpen) { return; }
        var entry = MyAvatar.position;
        MyAvatar.position = spectatorCameraConfig.position;
        MyAvatar.orientation = spectatorCameraConfig.orientation;
    };

    function onMessage(channel, message, sender) {
        if (channel !== MESSAGE_CHANNEL) { return; }
        if (sender !== MyAvatar.sessionUUID) { return; }
        print('onMessage', channel, message, sender);
        var parsed = JSON.parse(message);
        if ((parsed.method === 'close') && (parsed.opening !== that.entityID)) {
            closePortal();
        }
    }

    that.preload = function (entityID) {
        print("preload portal", entityID);
        that.entityID = entityID;
        Messages.subscribe(MESSAGE_CHANNEL);
        Messages.messageReceived.connect(onMessage);
    };
    that.unload = function (entityID) {
        print("unload portal", entityID);
        closePortal();
        Messages.unsubscribe(MESSAGE_CHANNEL);
        Messages.messageReceived.disconnect(onMessage);
    };
});
