"use strict";
/*jslint vars: true*/
/*globals print, Entities, Window*/

(function () {
    var id, that = this;
    var baseColor; // For unhighlight
    var text = "<i>Click to edit</i>";
    function saveBaseColor(entityID) {
        baseColor = Entities.getEntityProperties(entityID, ['color']).color;
        print("saveBaseColor", entityID);
    }
    function saveText(string) {
        // explicit empty string ok, else keep old if falsey
        text = (string === '') ? string : (string || text);
    }
    function updateLocalsFromProperties(entityID) {
        var sourceUrl = Entities.getEntityProperties(entityID, ['sourceUrl']).sourceUrl;
        var prefix = sourceUrl.match(/^data:(?:text\/html)?,/);
        if (!prefix) {
            print("Sticky note sourceUrl is not a data:, url:", sourceUrl);
            return;
        }
        var decoded = decodeURIComponent(sourceUrl.substring(prefix[0].length));
        print('hrs fixme source:', sourceUrl, 'prefix:', prefix, 'length', prefix.length, 'decoded:', decoded);
        saveText(decoded);
    }
    function updatePropertiesFromLocals(entityID) {
        Entities.editEntity(entityID, {
            sourceUrl: "data:text/html," + encodeURIComponent(text)
        });
    }
    function highlightColorComponent(unhighlighted) {
        var highlighted = Math.min(255, Math.max(30, 1.3 * (unhighlighted / 256) * 256));
        return highlighted;
    }
    // These event handlers are named (perhaps misguidedly) after the cross-device w3c input events.
    function pointerenter(entityID, data) {
        // Highlight to show we're hot.
        print("highlight", entityID, JSON.stringify(data));
        saveBaseColor(entityID);
        Entities.editEntity(entityID, {
            color: {
                red: highlightColorComponent(baseColor.red),
                green: highlightColorComponent(baseColor.green),
                blue: highlightColorComponent(baseColor.blue)
            }
        });
    }
    function pointerleave(entityID, data) {
        print("unhighlight", entityID, JSON.stringify(data));
        Entities.editEntity(entityID, {color: baseColor});
    }
    function pointerdown(entityID, data) {
        print("start drag", entityID, JSON.stringify(data));
        updateLocalsFromProperties(entityID);
        saveText(Window.prompt("Enter text", text));
        updatePropertiesFromLocals(entityID);
    }
    function pointermove(entityID, data) {
        // Button is "None" unless this is the first event in which it pressed.
        // Then after that, one of the isMumbleHeld will be true
        if ((data.button === "None") && !data.isPrimaryHeld && !data.isSecondaryHeld && !data.isTertiaryHeld) { return; }
        print("drag", entityID, JSON.stringify(data));
    }
    function pointerup(entityID, data) {
        print("end drag", entityID, JSON.stringify(data));
    }
    that.preload = function (entityID) {
        id = entityID;
        print(entityID);
        saveBaseColor(entityID); // Imperfect defensive programming in case we miss a pointerenter.
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
