sap.ui.define([
	"sap/m/Button"
], function (Button) {
	"use strict";
	//extend sap.m.button control
	return Button.extend("taskScheduler.control.CustomButton", {
		metadata: {
			//set dnd property in metadata to drop opportunity to custom button
			dnd: {
				droppable: true
			}
		},
		renderer: {}
	});
});