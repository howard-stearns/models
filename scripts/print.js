(function () {
    print('hello');
    print(JSON.stringify(this));
    this.clickDownOnEntity = function (entityID, mouseEvent) {
	print('clicked');
	print(JSON.stringify(this));
	print(JSON.stringify(entityID));
	print(JSON.stringify(mouseEvent));
	print(JSON.stringify(Entities.getEntityProperties(entityID)));
    };
})
