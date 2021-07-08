sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function(JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		
		// create new JSON model from .json file in project
		createTasksModel: function() {
			var sTaskViewModelPath = jQuery.sap.getModulePath("taskScheduler.model.TaskModel-Main", ".json");
			var oTaskViewModel = new JSONModel(sTaskViewModelPath);
			return oTaskViewModel;

		}

	};
});