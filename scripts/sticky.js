"use strict";
/*jslint vars: true*/
/*globals print, Entities, Window*/

(function () {
    var id, that = this;
    var text = "<i>Click to edit</i>";
    var baseRed = 238, baseGreen = 232, baseBlue = 170;
    function saveText(string) {
        // explicit empty string ok, else keep old if falsey
        text = (string === '') ? string : (string || text);
    }
    function updateLocalsFromProperties(entityID) {
        var sourceUrl = Entities.getEntityProperties(entityID, ['sourceUrl']).sourceUrl;
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
    function highlightColorComponent(unhighlighted) {
        var highlighted = Math.min(255, Math.max(30, 1.3 * (unhighlighted / 256) * 256));
        return highlighted;
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
    }
    function pointerleave(entityID, data) {
        print("unhighlight", entityID, JSON.stringify(data));
        updatePropertiesFromLocals(entityID);
    }
    function pointerdown(entityID, data) {
        print("start drag", entityID, JSON.stringify(data));
    }
    function pointermove(entityID, data) {
        // Button is "None" unless this is the first event in which it pressed.
        // Then after that, one of the isMumbleHeld will be true
        if ((data.button === "None") && !data.isPrimaryHeld && !data.isSecondaryHeld && !data.isTertiaryHeld) { return; }
        print("drag", entityID, JSON.stringify(data));
    }
    function pointerup(entityID, data) {
        print("end drag", entityID, JSON.stringify(data));
        saveText(Window.prompt("Enter text", text));
        updatePropertiesFromLocals(entityID);
    }
    that.preload = function (entityID) {
        id = entityID;
        print(entityID);
        updateLocalsFromProperties(entityID);
        updatePropertiesFromLocals(entityID);
    };
    that.unload = function () {
        print(id, 'shutting down');
    };
    that.hoverEnterEntity = pointerenter;
    that.hoverLeaveEntity = pointerleave;
    that.mousePressOnEntity = pointerdown;
    that.mouseMoveOnEntity = pointermove;
    that.mouseReleaseOnEntity = pointerup;
});
