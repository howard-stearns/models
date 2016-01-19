(function () {
    // See tests/performance/tribbles.js
    var dimensions, oldColor, entityID,
        editRate = 60,
        moveRate = 1,
        scale = 2,
        accumulated = 0,
        increment = {red: 1, green: 1, blue: 1},
        hasUpdate = false,
        shutdown = false,
        started = false,
        checker;
    function nextWavelength(color) {
        var old = oldColor[color];
        if (old === 255) {
            increment[color] = -1;
        } else if (old === 0) {
            increment[color] = 1;
        }
        var next = (old + increment[color]) % 256;
        return next;
    }
    function update(delta) {  // High frequency stuff is done in update in case we fall behind.
        accumulated += delta;
        if (accumulated > (1 / editRate)) {
            var newColor = {red: nextWavelength('red'), green: nextWavelength('green'), blue: nextWavelength('blue')};
            oldColor = newColor;
            Entities.editEntity(entityID, {color: newColor});
            accumulated = 0;
        }
    }
    function randomCentered() { return Math.random() - 0.5; }
    function randomVector() { return {x: randomCentered() * dimensions.x, y: randomCentered() * dimensions.y, z: randomCentered() * dimensions.z}; }
    function move() {
        var newData = {velocity: Vec3.sum({x: 0, y: 1, z: 0}, randomVector()), angularVelocity: Vec3.multiply(Math.PI, randomVector())};
        var nextChange = Math.ceil(Math.random() * 2000 / moveRate);
        Entities.editEntity(entityID, newData);
        if (!shutdown) { Script.setTimeout(move, nextChange); }
    }
    function startup() {
        started = true;
        var properties = Entities.getEntityProperties(entityID);
        var userData = properties.userData && JSON.parse(properties.userData);
        var moveTimeout = userData ? userData.moveTimeout : 0;
        var editTimeout = userData ? userData.editTimeout : 0;
        editRate = (userData && userData.editRate) || editRate;
        moveRate = (moveRate && userData.moveRate) || moveRate;
        oldColor = properties.color;
        dimensions = Vec3.multiply(scale, properties.dimensions);
        if (editTimeout) {
            hasUpdate = true;
            Script.update.connect(update);
            if (editTimeout > 0) {
                Script.setTimeout(function () { Script.update.disconnect(update); hasUpdate = false; }, editTimeout * 1000);
            }
        }
        if (moveTimeout) {
            Script.setTimeout(move, 1000);
            if (moveTimeout > 0) {
                Script.setTimeout(function () { shutdown = true; }, moveTimeout * 1000);
            }
        }
    };
    function writeNewUserData(userData) {
        Entities.editEntity(entityID, {userData: JSON.stringify(userData)});
    }
    function checkClaim() {
        if (started) { return; }
        var properties = Entities.getEntityProperties(entityID);
        var userData = properties.userData && JSON.parse(properties.userData);
        print(userData.owner, MyAvatar.sessionUUID, entityID, JSON.stringify(userData));
        if (userData.owner === MyAvatar.sessionUUID) {
            startup();
        } else if (!userData.owner) {
            print('claim it');
            userData.owner = MyAvatar.sessionUUID;
            writeNewUserData(userData);
        } else {
            var avatar = AvatarList.getAvatar(userData.owner);
            if (!avatar || (avatar === AvatarList.getAvatar(MyAvatar.sessionUUID))) { // quirk: getAvatar of missing id will answer our avatar
                print('clear it');
                delete userData.owner;
                writeNewUserData(userData);
            }
        }
    }
    this.preload = function (givenEntityID) {
        entityID = givenEntityID;
        checkClaim();
        checker = Script.setInterval(checkClaim, 2000);
    };
    this.unload = function () {
        Script.clearTimeout(checker);
        shutdown = true;
        if (hasUpdate) { Script.update.disconnect(update); }
    };
})
