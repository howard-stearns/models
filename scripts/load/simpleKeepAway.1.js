(function () {
    // The attached entity will move away from you if you are too close, checking at distanceRate.

    /* Example snippet:
Entities.addEntity({
            type: 'Sphere',
            name: 'keepAway',
            position: Vec3.sum(MyAvatar.position, Vec3.multiply(5, Quat.getFront(Camera.orientation))),
            dimensions: {x: 0.5, y: 0.5, z: 0.5},
            color: {red: Math.random() * 255, green: Math.random() * 255, blue: Math.random() * 255},
            damping: 0.5,
            angularDamping: 0.5,
            gravity: {x: 0, y: -9.8, z: 0},
            collisionsWillMove: true,
            script: "http://howard-stearns.github.io/models/scripts/load/simpleKeepAway.js"
        })
    */

    var entityID,
        distanceRate = 1,       // hertz
        distanceAllowance = 3,  // meters
        distanceScale = 0.5,    // meters/second
        distanceTimer;

    function moveDistance() {  // every user checks their distance and tries to claim if close enough.
        var me = MyAvatar.position,
            ball = Entities.getEntityProperties(entityID, ['position']).position;
        ball.y = me.y;
        var vector = Vec3.subtract(ball, me);

        if (Vec3.length(vector) < distanceAllowance) {
	    Entities.editEntity(entityID, {velocity: Vec3.multiply(distanceScale, Vec3.normalize(vector))});
        }
    }

    this.preload = function (givenEntityID) {
        var properties = Entities.getEntityProperties(givenEntityID, ['userData']),
            userData = properties.userData && JSON.parse(properties.userData);
        entityID = givenEntityID;
        if (userData) {
            distanceRate = userData.distanceRate || distanceRate;
            distanceAllowance = userData.distanceAllowance || distanceAllowance;
        }

        // run all the time by everyone:
        distanceTimer = Script.setInterval(moveDistance, distanceRate);
    };
    this.unload = function () {
        Script.clearTimeout(distanceTimer);
    };
})
