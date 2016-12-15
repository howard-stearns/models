var position = MyAvatar.position;
var right = Quat.getRight(MyAvatar.orientation);
position = Vec3.sum(position, Vec3.multiply(3, Quat.getFront(MyAvatar.orientation)));

var sphere = Overlays.addOverlay("sphere", {
    solid: true,
    color: {red: 20, green: 250, blue: 20},
    dimensions: 0.4,
    drawInFront: true,
    position: position
});

var image = Overlays.addOverlay("image3d", {
    color: {red: 255, green: 255, blue: 255},
    size: 0.4,
    drawInFront: true,
    isFacingAvatar: true,
    url: Script.resolvePath("assets/images/tools/nearby.svg"),
    position: Vec3.sum(position, Vec3.multiply(-1, right))
});

var model = Overlays.addOverlay("model", {
    dimensions: {x: 0.2, y: 2, z: 0.2},
    drawInFront: true,
    url: "http://hifi-content.s3.amazonaws.com/alan/dev/Person-basemesh.fbx",
    position: Vec3.sum(position, right)
});

Script.scriptEnding.connect(function () {
    Overlays.deleteOverlay(sphere);
    Overlays.deleteOverlay(image);
    Overlays.deleteOverlay(model);
});
