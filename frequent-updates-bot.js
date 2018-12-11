var WANT_DEBUGGING = false;

randFloat = function(low, high) {
    return low + Math.random() * (high - low);
}

var AVATARS_ARRAY = [
        "http://mpassets.highfidelity.com/0c2c264b-2fd2-46a4-bf80-de681881f66b-v1/F_MotRac.fst",
        "http://mpassets.highfidelity.com/bd80a6d7-7173-489e-87c6-f7ee56e65530-v1/M_RetFut.fst",
        "http://mpassets.highfidelity.com/47c8d706-d486-4c2d-afcc-70d4e1e25117-v1/M_RetSpaSuit.fst",
        "http://mpassets.highfidelity.com/548d0792-0bac-4933-bbfc-57d71912d77e-v1/M_OutMer.fst",
        "http://mpassets.highfidelity.com/13277c09-892f-4a5e-b9a5-8994a37d68bf-v1/F_WasWar.fst",
        "http://mpassets.highfidelity.com/2d384111-0f0e-42e2-b800-66bfcab4aefb-v1/F_VooQue.fst",
        "http://mpassets.highfidelity.com/57e4d1cd-9f52-4c95-9051-326f9bb114ea-v1/F_SteAvi.fst",
        "http://mpassets.highfidelity.com/da2ad4cd-47d4-41da-b764-41f39ff77e30-v1/F_JerGir.fst",
        "http://mpassets.highfidelity.com/96c747ab-f71b-44ee-8eb9-d19fc9593dda-v1/F_CatBur.fst",
        "http://mpassets.highfidelity.com/ede82c38-c66e-4f67-9e0b-0bb0782db18f-v1/M_WesOut.fst",
        "http://mpassets.highfidelity.com/8872ae86-a763-4db3-8373-d27514c1481e-v1/M_VinAvi.fst",
        "http://mpassets.highfidelity.com/faf505f1-4fd1-4ed2-8909-816af246c48f-v1/M_VicGen.fst",
        "http://mpassets.highfidelity.com/d807a7d2-5122-4436-a6f9-3173c94d1c49-v1/M_SuaGen.fst",
        "http://mpassets.highfidelity.com/1dd41735-06f4-45a3-9ec0-d05215ace77b-v1/M_MarSen.fst",
        "http://mpassets.highfidelity.com/2cad3894-8ab3-4ba5-a723-0234f93fbd6a-v1/M_BowBea.fst",
        "http://mpassets.highfidelity.com/cf0eb1be-9ec7-4756-8eaf-ac8f3ec09eba-v1/F_ClaDef.fst",
        "http://mpassets.highfidelity.com/0cedeca3-c1a4-4be9-9fd5-dad716afcc7e-v1/F_Cyria.fst",
        "http://mpassets.highfidelity.com/dc55803b-9215-47dd-9408-eb835dac4082-v1/F_ParGir.fst",
        "http://mpassets.highfidelity.com/775a8fb3-cfe7-494d-b603-a0a2d6910e55-v1/F_VinCov.fst",
        "http://mpassets.highfidelity.com/eba0d8f8-aa72-4a6b-ab64-4d3fd4695b20-v1/F_VogHei.fst"

     ];


var AVATAR_URL = AVATARS_ARRAY[Math.floor(Math.random() * AVATARS_ARRAY.length)];
print("RANDOM AVATAR SELECTED:" + AVATAR_URL);


// not quite what I want...
var LOCATIONS_ARRAY = [
  { min_x: -20, max_x: -7, y: -10.5, min_z: 15, max_z: 22}

];

var LOCATION_PARAMS = LOCATIONS_ARRAY[Math.floor(Math.random() * LOCATIONS_ARRAY.length)];

var LOCATION = { x: randFloat(LOCATION_PARAMS.min_x, LOCATION_PARAMS.max_x), y: LOCATION_PARAMS.y, z: randFloat(LOCATION_PARAMS.min_z, LOCATION_PARAMS.max_z) };

Vec3.print("RANDOM LOCATION SELECTED:", LOCATION);

var playFromCurrentLocation = true;
var loop = true;

// Disable the privacy bubble
Users.disableIgnoreRadius();

// Set position here if playFromCurrentLocation is true
Avatar.position = LOCATION;
Avatar.orientation = Quat.fromPitchYawRollDegrees(0, 0, 0);
Avatar.scale = 1.0;
Agent.isAvatar = true;

// make the agent "listen" to the audio stream to cause additional audio-mixer load, technically this isn't needed when you're playing a recording
// but if you switch to a non-recording bot, you will need this, so we can leave this.
Avatar.skeletonModelURL = AVATAR_URL; // FIXME - currently setting an avatar while playing a recording doesn't work it will be ignored

var entityJSON = {
    "properties": {
      "acceleration": {
        "blue": 0,
        "green": 0,
        "red": 0,
        "x": 0,
        "y": 0,
        "z": 0
      },
      "actionData": "",
      "age": 8.7204008102417,
      "ageAsText": "0 hours 0 minutes 8 seconds",
      "angularDamping": 0.39346998929977417,
      "angularVelocity": {
        "blue": 0,
        "green": 0,
        "red": 0,
        "x": 0,
        "y": 0,
        "z": 0
      },
      "animation": {
        "allowTranslation": true,
        "currentFrame": 0,
        "firstFrame": 0,
        "fps": 30,
        "hold": false,
        "lastFrame": 100000,
        "loop": true,
        "running": false,
        "url": ""
      },
      "boundingBox": {
        "brn": {
          "blue": -1.100000023841858,
          "green": 0.8999999761581421,
          "red": -0.10000000149011612,
          "x": -0.10000000149011612,
          "y": 0.8999999761581421,
          "z": -1.100000023841858
        },
        "center": {
          "blue": -1,
          "green": 1,
          "red": 0,
          "x": 0,
          "y": 1,
          "z": -1
        },
        "dimensions": {
          "blue": 0.20000004768371582,
          "green": 0.20000004768371582,
          "red": 0.20000000298023224,
          "x": 0.20000000298023224,
          "y": 0.20000004768371582,
          "z": 0.20000004768371582
        },
        "tfl": {
          "blue": -0.8999999761581421,
          "green": 1.100000023841858,
          "red": 0.10000000149011612,
          "x": 0.10000000149011612,
          "y": 1.100000023841858,
          "z": -0.8999999761581421
        }
      },
      "canCastShadow": true,
      "certificateID": "",
      "clientOnly": true,
      "cloneAvatarEntity": false,
      "cloneDynamic": false,
      "cloneLifetime": 300,
      "cloneLimit": 0,
      "cloneOriginID": "{00000000-0000-0000-0000-000000000000}",
      "cloneable": false,
      "collidesWith": "static,dynamic,kinematic,myAvatar,otherAvatar,",
      "collisionMask": 31,
      "collisionSoundURL": "",
      "collisionless": false,
      "collisionsWillMove": false,
      "compoundShapeURL": "",
      "created": "2018-07-26T21:58:48Z",
      "damping": 0.39346998929977417,
      "density": 1000,
      "description": "",
      "dimensions": {
        "blue": 0.20000000298023224,
        "green": 0.20000000298023224,
        "red": 0.20000000298023224,
        "x": 0.20000000298023224,
        "y": 0.20000000298023224,
        "z": 0.20000000298023224
      },
      "dynamic": false,
      "editionNumber": 0,
      "entityInstanceNumber": 0,
      "friction": 0.5,
      "gravity": {
        "blue": 0,
        "green": 0,
        "red": 0,
        "x": 0,
        "y": 0,
        "z": 0
      },
      "href": "",
      "id": "{05162d5d-5e65-4837-ad50-57041c8be427}",
      "ignoreForCollisions": false,
      "itemArtist": "",
      "itemCategories": "",
      "itemDescription": "",
      "itemLicense": "",
      "itemName": "",
      "lifetime": 3600,
      "limitedRun": 4294967295,
      "localPosition": {
        "blue": -1,
        "green": 1,
        "red": 0,
        "x": 0,
        "y": 1,
        "z": -1
      },
      "localRotation": {
        "w": 1,
        "x": 0,
        "y": 0,
        "z": 0
      },
      "locked": false,
      "marketplaceID": "",
      "modelURL": "http://www.capondesign.com/EXternal/models/ironman/TonyV2.fst",
      "name": "FloofEntity",
      "naturalDimensions": {
        "blue": 0.3754480481147766,
        "green": 1.8120945692062378,
        "red": 1.9409140348434448,
        "x": 1.9409140348434448,
        "y": 1.8120945692062378,
        "z": 0.3754480481147766
      },
      "naturalPosition": {
        "blue": 0.02164822816848755,
        "green": 0.9060472846031189,
        "red": -1.8835067749023438e-05,
        "x": -1.8835067749023438e-05,
        "y": 0.9060472846031189,
        "z": 0.02164822816848755
      },
      "originalTextures": "{\n    \"Tony_Stark_Beard_Diffuse\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Beard_Diffuse.png\",\n    \"Tony_Stark_Beard_Gloss\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Beard_Gloss.png\",\n    \"Tony_Stark_Beard_Normal\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Beard_Normal.png\",\n    \"Tony_Stark_Beard_Specular\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Beard_Specular.png\",\n    \"Tony_Stark_Body_Diffuse\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Body_Diffuse.png\",\n    \"Tony_Stark_Body_Gloss\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Body_Gloss.png\",\n    \"Tony_Stark_Body_Normal\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Body_Normal.png\",\n    \"Tony_Stark_Body_Specular\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Body_Specular.png\",\n    \"Tony_Stark_Bottom_Diffuse\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Bottom_Diffuse.png\",\n    \"Tony_Stark_Bottom_Gloss\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Bottom_Gloss.png\",\n    \"Tony_Stark_Bottom_Normal\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Bottom_Normal.png\",\n    \"Tony_Stark_Bottom_Specular\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Bottom_Specular.png\",\n    \"Tony_Stark_Eyewear_Diffuse\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Eyewear_Diffuse.png\",\n    \"Tony_Stark_Eyewear_Gloss\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Eyewear_Gloss.png\",\n    \"Tony_Stark_Eyewear_Normal\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Eyewear_Normal.png\",\n    \"Tony_Stark_Eyewear_Specular\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Eyewear_Specular.png\",\n    \"Tony_Stark_Hair_Diffuse\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Hair_Diffuse.png\",\n    \"Tony_Stark_Hair_Gloss\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Hair_Gloss.png\",\n    \"Tony_Stark_Hair_Normal\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Hair_Normal.png\",\n    \"Tony_Stark_Hair_Specular\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Hair_Specular.png\",\n    \"Tony_Stark_Moustache_Diffuse\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Moustache_Diffuse.png\",\n    \"Tony_Stark_Moustache_Gloss\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Moustache_Gloss.png\",\n    \"Tony_Stark_Moustache_Normal\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Moustache_Normal.png\",\n    \"Tony_Stark_Moustache_Specular\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Moustache_Specular.png\",\n    \"Tony_Stark_Shoes_Diffuse\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Shoes_Diffuse.png\",\n    \"Tony_Stark_Shoes_Gloss\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Shoes_Gloss.png\",\n    \"Tony_Stark_Shoes_Normal\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Shoes_Normal.png\",\n    \"Tony_Stark_Shoes_Specular\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Shoes_Specular.png\",\n    \"Tony_Stark_Top_Diffuse\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Top_Diffuse.png\",\n    \"Tony_Stark_Top_Gloss\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Top_Gloss.png\",\n    \"Tony_Stark_Top_Normal\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Top_Normal.png\",\n    \"Tony_Stark_Top_Specular\": \"http://www.capondesign.com/EXternal/models/ironman/TonyV2/textures/Tony_Stark_Top_Specular.png\"\n}\n",
      "owningAvatarID": "{b5229825-2c0b-4ef5-bcfc-913858ebe7b3}",
      "parentID": "{b5229825-2c0b-4ef5-bcfc-913858ebe7b3}",
      "parentJointIndex": 65535,
      "position": {
        "blue": -1,
        "green": 1,
        "red": 0,
        "x": 0,
        "y": 1,
        "z": -1
      },
      "queryAACube": {
        "scale": 1.039230465888977,
        "x": 8.594402313232422,
        "y": 0.9403275847434998,
        "z": -29.112281799316406
      },
      "registrationPoint": {
        "blue": 0.5,
        "green": 0.5,
        "red": 0.5,
        "x": 0.5,
        "y": 0.5,
        "z": 0.5
      },
      "relayParentJoints": true,
      "renderInfo": {
        "drawCalls": 9,
        "hasTransparent": false,
        "texturesCount": 27,
        "texturesSize": 27525120,
        "verticesCount": 25745
      },
      "restitution": 0.5,
      "rotation": {
        "w": 1,
        "x": 0,
        "y": 0,
        "z": 0
      },
      "script": "",
      "scriptTimestamp": 0,
      "serverScripts": "",
      "shapeType": "none",
      "staticCertificateVersion": 0,
      "textures": "",
      "type": "Model",
      "userData": "",
      "velocity": {
        "blue": 0,
        "green": 0,
        "red": 0,
        "x": 0,
        "y": 0,
        "z": 0
      },
      "visible": true
    }
  };

var count = 0;

function update(event) {
  if (++count % 2 == 0) {
    entityJSON["name"] = randFloat(LOCATION_PARAMS.min_x, LOCATION_PARAMS.max_x);
    Avatar.setAvatarEntityData({ "ff898dea-cb9a-4952-9639-3cb7dfe884df" : entityJSON });
  }

  if (count % 100 == 0) {
    var AVATAR_URL = AVATARS_ARRAY[Math.floor(Math.random() * AVATARS_ARRAY.length)];
    // print("RANDOM AVATAR SELECTED:" + AVATAR_URL);

    Avatar.skeletonModelURL = AVATAR_URL;
  }
}

Script.update.connect(update);
