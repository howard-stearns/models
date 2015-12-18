"use strict";
var Entities, print;

function deleteSome() {
    var count = 0, ids = Entities.findEntities({x: 0, y: 0, z: 0}, 35000);
    print('Total ' + ids.length + ' entities.');
    ids = ids.filter(function (id) { return Entities.getEntityProperties(id, 'name').name === "gridTest"; });
    print('Grid ' + ids.length + ' entities.');
    function andAgain() {
        if (!ids.length) { return print('deleted ' + count + ' entities.'); }
        var id = ids.pop();
        Entities.deleteEntity(id);
        count++;
        print('delete ' + id);
        Script.setTimeout(andAgain, 500);
    }
    andAgain();
}
deleteSome();
