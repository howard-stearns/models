(function () {
    // See tribbles.js
    var scale = 2, dimensions, accumulated = 0, oldColor, entityID, increment = {red: 1, green: 1, blue: 1}, shutdown = false;
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
        if (accumulated > (1 / 60)) {
            var newColor = {red: nextWavelength('red'), green: nextWavelength('green'), blue: nextWavelength('blue')};
            oldColor = newColor;
            Entities.editEntity(entityID, {color: newColor});
            accumulated = 0;
        }
    }
    function randomCentered() { return Math.random() - 0.5; }
    function randomVector() { return {x: randomCentered() * dimensions.x, y: randomCentered() * dimensions.y, z: randomCentered() * dimensions.z}; }
    function move() {
        var newData = {velocity: Vec3.sum({x:0, y: 1, z: 0}, randomVector()), angularVelocity: Vec3.multiply(Math.PI, randomVector())};
        var nextChange = Math.ceil(Math.random() * 2000);
        Entities.editEntity(entityID, newData);
        if (!shutdown) { Script.setTimeout(move, nextChange); }
    }
    this.preload = function (givenEntityID) {
        entityID = givenEntityID;
        var properties = Entities.getEntityProperties(entityID);
	var parameters = properties.userData && JSON.parse(properties.userData);
	var movingTimeout = parameters ? parameters.moveTimeout : 0;
	console.log(properties.userData, parameters, movingTimeout);
        oldColor = properties.color;
        dimensions = Vec3.multiply(scale, properties.dimensions);
        Script.update.connect(update);
        Script.setTimeout(move, 1000);
	if (movingTimeout) { Script.setTimeout(function () { shutdown = true; }, movingTimeout * 1000); }
    };
    this.unload = function () {
        shutdown = true;
        Script.update.disconnect(update);
    };
})
