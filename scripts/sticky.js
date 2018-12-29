"use strict";
/*jslint vars: true*/
/*globals print, Entities, Vec3, Quat, Script, Window*/

(function () {
    var that = this;

    // Manage local properties.
    var text = "<i>Click to edit</i>";
    var baseRed = 238, baseGreen = 232, baseBlue = 170;
    var width, height, halfThickness;
    function saveText(string) {
        // explicit empty string ok, else keep old if falsey
        text = (string === '') ? string : (string || text);
    }
    function updateLocalsFromProperties(entityID) {
        var properties = Entities.getEntityProperties(entityID, ['sourceUrl', 'dimensions']);
        var sourceUrl = properties.sourceUrl;
        halfThickness = properties.dimensions.z / 2;
        width = properties.dimensions.x;
        height = properties.dimensions.y;
        // One might think that for a whole URL, you would use decodeURI, but that doesn't handle the HTML angle brackets. Use decodeURIComponent.
        var decodedUrl = decodeURIComponent(sourceUrl);
        // <style>body {background-color: RGB(238, 232, 170);}</style><i>Click to edit</i>
        var prefix = decodedUrl.match(/^data:(?:text\/html)?,(?:\<style>body {background-color: RGB\((\d{1,3}), (\d{1,3}), (\d{1,3}\));}<\/style>)?/);
        if (!prefix) {
            print("Sticky note sourceUrl is not a data:, url:", sourceUrl);
            return;
        }
        if (prefix[1]) { baseRed = parseInt(prefix[1], 10); }
        if (prefix[2]) { baseGreen = parseInt(prefix[2], 10); }
        if (prefix[3]) { baseBlue = parseInt(prefix[3], 10); }
        var content = decodedUrl.substring(prefix[0].length);
        print('hrs fixme source:', sourceUrl, 'decoded:', decodedUrl, 'prefix:', prefix, 'length:', prefix[0].length, 'content:', content);
        saveText(content);
    }
    function updatePropertiesFromLocals(entityID, red, green, blue) {
        function color(requested, defaulted) { return (requested === undefined) ? defaulted : requested; }
        var url = "data:text/html," + encodeURIComponent("<style>body {background-color: RGB(" + color(red, baseRed) + ", " + color(green, baseGreen) + ", " + color(blue, baseBlue) + ");}</style>" + text);
        print('hrs fixme new text:', text, 'source:', url);
        Entities.editEntity(entityID, { sourceUrl: url });
    }

    // UI helpers.
    function localToWorld(localOffset, framePosition, frameOrientation) {
        var worldOffset = Vec3.multiplyQbyV(frameOrientation, localOffset);
        return Vec3.sum(framePosition, worldOffset);
    }
    function worldToLocal(worldPosition, framePosition, frameOrientation, optionalInverseFrameOrientation) {
        var inverseFrameOrientation = optionalInverseFrameOrientation || Quat.inverse(frameOrientation);
        var worldOffset = Vec3.subtract(worldPosition, framePosition);
        return Vec3.multiplyQbyV(inverseFrameOrientation, worldOffset);
    }
    function highlightColorComponent(unhighlighted) {
        var highlighted = Math.min(255, Math.max(30, 1.3 * (unhighlighted / 256) * 256));
        return highlighted;
    }
    function offset(position, unitDirection, distance) {
        return Vec3.sum(position, Vec3.multiply(distance, unitDirection));
    }
    var upperLeft, upperRight, lowerLeft, lowerRight, affordanceFraction = 0.15, affordanceAlpha = 0;
    function sizeAffordance(affordanceID, direction) {
        Entities.editEntity(affordanceID, {
            visible: true,
            alpha: affordanceAlpha,
            color: {red: baseRed, green: baseGreen, blue: baseBlue},
            localPosition: {x: direction.x * width, y: direction.y * height, z: 0},
            dimensions: {x: affordanceFraction * width, y: affordanceFraction * height, z: 3 * halfThickness}
        });
    }
    function fadeAffordances() {
        var properties;
        affordanceAlpha -= 0.01;
        if (affordanceAlpha <= 0.05) {
            Script.update.disconnect(fadeAffordances);
            properties = {visible: false};
        } else {
            properties = {alpha: affordanceAlpha};
        }
        Entities.editEntity(upperLeft, properties);
        Entities.editEntity(upperRight, properties);
        Entities.editEntity(lowerLeft, properties);
        Entities.editEntity(lowerRight, properties);
    }
    function makeAffordance(entityID, label) {
        return Entities.addEntity({
            type: 'Box',
            visible: false,
            parentID: entityID,
            name: label
        });
    }
    var didDrag, lastPos3D, initialLocalOffset;
    var MINIMUM_3D_MOVEMENT = 0.001, DOT_PRODUCT_SAME = 0.01;
    function updatePosition(entityID, position, direction) {
        // If we've moved far enough in 3d (e.g., a twist of the wrist counts), then place us up against the first intersection behind and answer true;
        // Else false;
        //print('HRS fixme updatePosition');
        var distance = Vec3.distance(position, lastPos3D);
        //print('HRS fixme updatePosition from:', JSON.stringify(lastPos3D), JSON.stringify(position), distance);
        if (distance < MINIMUM_3D_MOVEMENT) { return false; }
        var behind = offset(position, direction, -1); // back it up in front of us, in case the object behind has a surface that sticks out
        var pickray = {origin: behind, direction: direction};
        var intersection = Entities.findRayIntersection(pickray, true, [], [entityID], true, false);
        //print('HRS fixme updatePosition', JSON.stringify(position), JSON.stringify(direction), JSON.stringify(behind), '=>', JSON.stringify(intersection));
        if (!intersection || !intersection.intersects) { return false; }
        lastPos3D = position;
        didDrag = true;
        var newTangentPosition = offset(intersection.intersection, intersection.surfaceNormal, halfThickness);
        var isVerticalNormal = (1 - Math.abs(Vec3.dot(Vec3.UNIT_Y, intersection.surfaceNormal))) < DOT_PRODUCT_SAME;
        var newOrientation = Quat.lookAtSimple(newTangentPosition, intersection.intersection, isVerticalNormal ? direction : Vec3.UNIT_Y);
        var newGlobalOffset = localToWorld(initialLocalOffset, Vec3.ZERO, newOrientation);
        var newCenter = Vec3.sum(newTangentPosition, newGlobalOffset);
        //print('HRS fixme newTangentPosition:', JSON.stringify(newTangentPosition), 'initial offset:', JSON.stringify(initialLocalOffset), 'new offset:', JSON.stringify(newGlobalOffset), 'center:', JSON.stringify(newCenter));
        Entities.editEntity(entityID, {position: newCenter, rotation: newOrientation});
        return true;
    }

    // These event handlers are named (perhaps misguidedly) after the cross-device w3c input events.
    function pointerenter(entityID, data) {
        // Highlight to show we're hot.
        print("highlight", entityID, JSON.stringify(data));
        updateLocalsFromProperties(entityID);
        updatePropertiesFromLocals(entityID,
                                   highlightColorComponent(baseRed),
                                   highlightColorComponent(baseGreen),
                                   highlightColorComponent(baseBlue));
        affordanceAlpha = 0.9;
        sizeAffordance(upperLeft, {x: -0.5, y: 0.5, z: 0});
        sizeAffordance(upperRight, {x: 0.5, y: 0.5, z: 0});
        sizeAffordance(lowerLeft, {x: -0.5, y: -0.5, z: 0});
        sizeAffordance(lowerRight, {x: 0.5, y: -0.5, z: 0});
    }
    function pointerleave(entityID, data) {
        print("unhighlight", entityID, JSON.stringify(data));
        updatePropertiesFromLocals(entityID);
        Script.update.connect(fadeAffordances);
    }
    function pointerdown(entityID, data) {
        print("start drag", entityID, JSON.stringify(data));
        var properties = Entities.getEntityProperties(entityID, ['position', 'rotation']);
        lastPos3D = data.pos3D;
        didDrag = false;
        initialLocalOffset = Vec3.multiply(-1, worldToLocal(lastPos3D, properties.position, properties.rotation));
    }
    function pointermove(entityID, data) {
        // Button is "None" unless this is the first event in which it pressed.
        // Then after that, one of the isMumbleHeld will be true
        if ((data.button === "None") && !data.isPrimaryHeld && !data.isSecondaryHeld && !data.isTertiaryHeld) { return; }
        //print("drag", entityID, JSON.stringify(data));
        updatePosition(entityID, data.pos3D, data.direction);
    }
    function pointerup(entityID, data) {
        print("end drag", entityID, JSON.stringify(data));
        if (didDrag || updatePosition(entityID, data.pos3D, data.direction)) { return; }
        saveText(Window.prompt("Enter text", text));
        updatePropertiesFromLocals(entityID);
    }

    // Wire it up!
    that.preload = function (entityID) {
        print(entityID);
        updateLocalsFromProperties(entityID);
        updatePropertiesFromLocals(entityID);
        upperLeft = makeAffordance(entityID, 'upperLeftAffordance');
        upperRight = makeAffordance(entityID, 'upperRightAffordance');
        lowerLeft = makeAffordance(entityID, 'lowerLeftAffordance');
        lowerRight = makeAffordance(entityID, 'lowerRightAffordance');
    };
    that.unload = function (entityID) {
        print(entityID, 'shutting down');
        Entities.deleteEntity(upperLeft);
        Entities.deleteEntity(upperRight);
        Entities.deleteEntity(lowerLeft);
        Entities.deleteEntity(lowerRight);
    };
    that.hoverEnterEntity = pointerenter;
    that.hoverLeaveEntity = pointerleave;
    that.mousePressOnEntity = pointerdown;
    that.mouseMoveOnEntity = pointermove;
    that.mouseReleaseOnEntity = pointerup;
});
