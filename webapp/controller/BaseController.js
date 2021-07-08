/*global history */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel"
], function(Controller, History, JSONModel) {
	"use strict";

	return Controller.extend("taskScheduler.controller.BaseController", {

		getRouter: function() {
			return this.getOwnerComponent().getRouter();
		},

		getModel: function(sName) {
			return this.getView().getModel(sName);
		},

		setModel: function(oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		getResourceBundle: function() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		onNavBack: function() {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("Default", {}, true);
			}
		},

		setBusy: function(state) {
			this.getModel("appView").setProperty("/busy", state);
		},

		setJsonModel: function(sModelName) {
			var oJsonModel = new JSONModel();
			this.setModel(oJsonModel, sModelName);
		}

	});

});