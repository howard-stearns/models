Agent.isAvatar = true; // This puts a robot at 0,0,0, but is currently necessary in order to use AvatarList.
Avatar.skeletonModelURL = "http://hifi-content.s3.amazonaws.com/ozan/dev/avatars/invisible_avatar/invisible_avatar.fst";

var imono = {
    localOnly: false,
    stereo: false,
    volume: 1,
    position: Avatar.position,
    loop: true
};
var piano1 = SoundCache.getSound("http://howard-stearns.github.io/models/sounds/piano1.wav");
var injectorLoop = Audio.playSound(piano1, imono);

