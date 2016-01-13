(function () {
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
            //print(JSON.stringify({oldColor: oldColor, newColor: newColor, increment: increment}));
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
        //print('editing:' + JSON.stringify(newData));
        Entities.editEntity(entityID, newData);
        //print('edited. setting timeout:' + nextChange);
        if (!shutdown) { Script.setTimeout(move, nextChange); }
    }
    this.preload = function (givenEntityID) {
        entityID = givenEntityID;
        var props = Entities.getEntityProperties(entityID);
        oldColor = props.color;
        dimensions = Vec3.multiply(scale, props.dimensions);
        Script.update.connect(update);
        Script.setTimeout(move, 1000);
        //print("Initial dimensions = " + JSON.stringify(dimensions));
    };
    this.unload = function () {
        shutdown = true;
        Script.update.disconnect(update);
    };
})
