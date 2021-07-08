sap.ui.define([
	"taskScheduler/controller/BaseController",
	"taskScheduler/model/formatter",
	"sap/ui/core/ValueState",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function(BaseController, formatter, ValueState, MessageToast, MessageBox) {
	"use strict";

	return BaseController.extend("taskScheduler.controller.TaskScheduler", {

		formatter: formatter,

		onInit: function() {
			var oTasksModel = this.getOwnerComponent().getModel("tasks");
			this.setModel(oTasksModel, "tasks");

			this._oTasksCalendar = this.byId("TasksPlanningCalendar-M");
			
			this._oAddNewTaskMDialog = this.byId("AddNewTask-MDialog");
			this._oEditTaskMDialog = this.byId("EditTask-MDialog");
			this._oAssignTaskMDialog = this.byId("AssignTask-MDialog");
			this._oDisplayTaskMDialog = this.byId("DisplayTask-MDialog");
			this._oAddNewEmployeeMDialog = this.byId("AddNewEmployee-MDialog");
			
			this.setJsonModel("assignModel", this._oAssignTaskMDialog);
			this.setJsonModel("editModel", this._oEditTaskMDialog);
			this.setJsonModel("displayModel", this._oDisplayTaskMDialog);

			this._oNewTaskTypeMSelect = this.byId("NewTaskType-MSelect");
			this._oNewTaskDescriptionMInput = this.byId("NewTaskDescription-MInput");
			this._oNewTaskDateMPicker = this.byId("NewTaskDate-MPicker");
			this._oNewTaskDaysMInput = this.byId("NewTaskDays-MInput");

			this._oEditTypeMSelect = this.byId("EditTaskType-MSelect");
			this._oEditDescriptionMInput = this.byId("EditTaskDescription-MInput");
			this._oEditDateMPicker = this.byId("EditTaskDate-MPicker");
			this._oEditDaysMInput = this.byId("EditTaskDays-MInput");

			this._oAddNewEmployeeNameMInput = this.byId("AddNewEmployeeName-MInput");
			this._oNewTaskFormContainerM = this.byId("NewTaskFormContainer-M");
			this._oEditFormContainerM = this.byId("EditFormContainer-M");

		},

		addNewTaskToPool: function(oEvent) {
			this._oAddNewTaskMDialog.open();
		},

		onCreateUserPress: function(oEvent) {
			this._oAddNewEmployeeMDialog.open();
		},

		onPressAddNewTaskOk: function(oEvent) {
			var oTaskModel = this.getModel("tasks");
			var oNewTask = {
				"TaskId": oTaskModel.getProperty("/TaskIdCounter"),
				"iconId": this._oNewTaskTypeMSelect.getSelectedKey(),
				"TaskName": this._oNewTaskDescriptionMInput.getValue(),
				"StartDate": this._oNewTaskDateMPicker.getValue(),
				"Days": this._oNewTaskDaysMInput.getValue()
			};
			//increase counter to generate unique id of task
			oTaskModel.setProperty("/TaskIdCounter", ++oNewTask.TaskId);
			oTaskModel.getProperty("/UnassignedTasks").push(oNewTask);
			this.showMessageToast("ts.taskScheduler.addNewTask.success");
			oTaskModel.refresh();
			this.onPressAddNewTaskCancel();
		},

		onPressAddNewTaskCancel: function(oEvent) {
			this._oAddNewTaskMDialog.close();
		},

		onPressAddNewUserOk: function(oEvent) {
			var oTaskModel = this.getModel("tasks");
			var oNewEmployee = {
				"employeeId": oTaskModel.getProperty("/EmployeeIdCounter"),
				"EmployeeName": this._oAddNewEmployeeNameMInput.getValue(),
				"Tasks": []

			};
			//increase counter to generate unique id of employee
			oTaskModel.setProperty("/EmployeeIdCounter", ++oNewEmployee.employeeId);
			oTaskModel.getProperty("/Employees").push(oNewEmployee);
			this.showMessageToast("ts.taskScheduler.addNewEmployee.success");
			oTaskModel.refresh();
			this.onPressAddNewUserCancel();
		},

		showMessageToast: function(sText) {
			var oI18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			MessageToast.show(oI18n.getText(sText), {
				duration: 3000,
				autoClose: true,
				animationTimingFunction: "ease",
				animationDuration: 1000,
				closeOnBrowserNavigation: false
			});
		},

		onPressAddNewUserCancel: function(oEvent) {
			this._oAddNewEmployeeMDialog.close();
		},

		onPressAssignTaskToUser: function(oEvent) {

		},

		handleAppointmentDragEnter: function(oEvent) {
			if (this.isWeekendDnD(oEvent)) {
				//prevent drop
				oEvent.preventDefault();
			}
		},

		//prevent drop to weekend if we are in week view
		isWeekendDnD: function(oEvent) {
			if (this._oTasksCalendar.getViewKey() !== "week") {
				return false;
			}
			var iStartDateDay = new Date(oEvent.getParameter("startDate")).getDay();
			return (iStartDateDay === 6) || (iStartDateDay === 0);
		},

		handleAppointmentDrop: function(oEvent) {
			var oAppointment = oEvent.getParameter("appointment"),
				oStartDate = oEvent.getParameter("startDate"),
				oEndDate = oEvent.getParameter("endDate"),
				oCalendarRow = oEvent.getParameter("calendarRow"),
				bCopy = oEvent.getParameter("copy"),
				oModel = this.getView().getModel("tasks"),
				oAppBindingContext = oAppointment.getBindingContext("tasks"),
				oRowBindingContext = oCalendarRow.getBindingContext("tasks"),
				handleAppointmentDropBetweenRows = function() {
					var aPath = oAppBindingContext.getPath().split("/"),
						iIndex = aPath.pop(),
						sRowAppointmentsPath = aPath.join("/");

					oRowBindingContext.getObject().Tasks.push(
						oModel.getProperty(oAppBindingContext.getPath())
					);

					oModel.getProperty(sRowAppointmentsPath).splice(iIndex, 1);
				};

			if (bCopy) {
				var oProps = Object.assign({}, oModel.getProperty(oAppointment.getBindingContext().getPath()));
				oProps.start = oStartDate;
				oProps.end = oEndDate;

				oRowBindingContext.getObject().appointments.push(oProps);
			} else {
				oModel.setProperty("StartDate", oStartDate, oAppBindingContext);
				oModel.setProperty("EndDate", oEndDate, oAppBindingContext);

				if (oAppointment.getParent() !== oCalendarRow) {
					handleAppointmentDropBetweenRows();
				}
			}

			oModel.refresh(true);

			this.showMessageToast("ts.taskScheduler.dndTaskInCalendar.success");
		},

		//fields validation before employee creation
		onValidateEmployee: function(oEvent) {
			var oTasksModel = this.getOwnerComponent().getModel("tasks");
			var oControl = oEvent.getSource();
			var bEmployeeNameFilled = oControl.getValue() ? true : false;
			var oValueState = bEmployeeNameFilled ? ValueState.None : ValueState.Error;
			oTasksModel.setProperty("/validateNewEmployee", bEmployeeNameFilled);
			oControl.setValueState(oValueState);
		},

		//validate all fields before task creation
		onValidateTask: function(oEvent) {
			var oTasksModel = this.getModel("tasks");
			var oControl;
			var oValueState;
			var bIsFilledForm = true;

			//loop for all elements in one FormContainer
			this._oNewTaskFormContainerM.getFormElements().forEach(function(oFormElement, iIndex) {

				var bIsEmptyMandatory = false;
				switch (iIndex) {
					case 0:
						//task type field
						oControl = oFormElement.getFields()[0];
						bIsEmptyMandatory = !oControl.getSelectedItem();
						oValueState = bIsEmptyMandatory ? ValueState.Error : ValueState.None;
						oControl.setValueState(oValueState);
						break;
					case 1:
						//task description field
						oControl = oFormElement.getFields()[0];
						bIsEmptyMandatory = !oControl.getValue();
						oValueState = bIsEmptyMandatory ? ValueState.Error : ValueState.None;
						oControl.setValueState(oValueState);
						break;
					case 2:
						//task sap.m.DatePicker and hours fields
						var oDatePicker = oFormElement.getFields()[0];
						var bIsEmptyOrWeekendDatePicker = this.validateDateDatePicker(oDatePicker.getValue());
						//set valueState of sap.m.DatePicker
						var oValueStateDatePicker = bIsEmptyOrWeekendDatePicker ? ValueState.Error : ValueState.None;
						oDatePicker.setValueState(oValueStateDatePicker);
						
						var oDaysInput = oFormElement.getFields()[1];
						var sDaysValue = oDaysInput.getValue();
						
						//regular expression for matching number with desirable precision
						var oNumericRegex = /([0-9]([0-9]{0,2})((?=[\.,\,])([\.,\,][0-9]{0,1})))|[1-9]([0-9]{0,2})/;

						var aMatchValue = sDaysValue.match(oNumericRegex);
						var sNewValue = aMatchValue ? aMatchValue[0].replace(",", ".") : null;
						
						//if we don't have any matches of regular expression, we will replace value to "0.0"
						if (sNewValue) {
							oDaysInput.setValue(sNewValue);
						} else {
							oDaysInput.setValue(0.0);
						}
						//validation for emptyness of task hours field 
						var bIsEmptyMandatoryosDaysValueInput = parseFloat(oDaysInput.getValue()).toFixed(1) <= "0.0";
						var oValueStateDaysInput = bIsEmptyMandatoryosDaysValueInput ? ValueState.Error : ValueState.None;
						oDaysInput.setValueState(oValueStateDaysInput);

						bIsEmptyMandatory = bIsEmptyOrWeekendDatePicker || bIsEmptyMandatoryosDaysValueInput;
						break;
					default:
						break;
				}
				//Summary validation for all fields
				if (bIsEmptyMandatory) {
					bIsFilledForm = false;
				}
			}.bind(this));
			oTasksModel.setProperty("/validateNewTask", bIsFilledForm);
			oTasksModel.refresh();
		},
		
		//Method for validating datepicker in edit and create task
		validateDateDatePicker: function(sDate) {
			if (!sDate) {
				return true;
			}
			var iStartDateDay = new Date(sDate).getDay();
			//if day === saturday or day === sunday
			var bIsWeekend = (iStartDateDay === 6) || (iStartDateDay === 0);
			if (bIsWeekend) {
				this.showMessageToast("ts.taskScheduler.dialogs.datePicker.weekend");
				return true;
			} else {
				return false;
			}
		},
		
		onListPlanningCalendardragStart: function(oEvent) {
			var oDragSession = oEvent.getParameter("dragSession");
			var oDraggedRow = oEvent.getParameter("target");
			//set dragged data to drag session
			oDragSession.setComplexData("onListDragContext", oDraggedRow);
		},

		onListPlanningCalendarDrop: function(oEvent) {
			var oDroppedControl = oEvent.getParameter("droppedControl");
			var oDragSession = oEvent.getParameter("dragSession");
			var cliId = oDroppedControl.getId();
			var rowId = cliId.replace("-CLI", "");
			var pcRow = sap.ui.getCore().byId(rowId);
			var oBindingContext = pcRow.getBindingContext("tasks");
			var resourceObj = oBindingContext.getObject();
			var oDraggedRowContext = oDragSession.getComplexData("onListDragContext");
			var oDraggedRowObject = oDraggedRowContext.getBindingContext("tasks").getObject();
			
			//assign data from dragged object to temporary model 
			this.getModel("assignModel").setData({
				TaskId: oDraggedRowObject.TaskId,
				TaskName: oDraggedRowObject.TaskName,
				StartDate: oDraggedRowObject.StartDate,
				Days: oDraggedRowObject.Days,
				iconId: oDraggedRowObject.iconId,
				DraggedTaskPath: oDraggedRowContext.getBindingContext("tasks").getPath(),
				EmployeeName: resourceObj.EmployeeName,
				TargetEmployeePath: oBindingContext.getPath()
			});

			this._oAssignTaskMDialog.open();
		},

		onUnassignTaskFromEmployee: function(oEvent) {
			var oDraggedControlBindingContext = oEvent.getParameter("draggedControl").getBindingContext("tasks");
			var oDraggedControlObject = oDraggedControlBindingContext.getObject();
			var iStartDate = new Date(oDraggedControlObject.StartDate).getTime();
			var iEndDate = new Date(oDraggedControlObject.EndDate).getTime();
			
			// Round days difference between StartDate and EndDate of appointment to one digit after point
			var fDatesDifference = (Math.abs((iEndDate - iStartDate)) / (1000 * 60 * 60 * 24)).toFixed(1);
			
			//if we have days count beetween 0.0 and 0.1 we will round it to 0.1
			oDraggedControlObject.Days = fDatesDifference === "0.0" ? "0.1" : fDatesDifference;
			
			//get dragged object binding context path
			var sBindingPath = oDraggedControlBindingContext.getPath();
			//path to task array in calendar
			var sPathToTaskArray = sBindingPath.substring(0, sBindingPath.lastIndexOf("/") + 1);
			var oTaskModel = this.getModel("tasks");
			//get index of element in calendar
			var iCounter = sBindingPath.substring(sBindingPath.lastIndexOf("/") + 1, sBindingPath.length);
			//get object from task model
			var oTaskSet = oTaskModel.getProperty(sPathToTaskArray);
			//push object from employee's task array to unassigned task array
			oTaskModel.getProperty("/UnassignedTasks").push(oDraggedControlObject);
			//remove old object from eployee array
			oTaskSet.splice(iCounter, 1);
			//task model refresh
			oTaskModel.refresh(true);
		},
		
		//method for delete entry in unassigned task list
		onTaskDeletePress: function(oEvent) {
			var sBindingPath = oEvent.getSource().getBindingContext("tasks").getPath();
			MessageBox.confirm(this.getResourceBundle().getText("ts.taskScheduler.master.list.delete.confirmDelete"), {
				onClose: function(sAction) {
					if (sAction === "OK") {

						var oTaskModel = this.getModel("tasks");
						var aPath = sBindingPath.split("/");
						var iCounter = aPath[aPath.length - 1];
						var oTaskSet = oTaskModel.getProperty("/UnassignedTasks");
						oTaskSet.splice(iCounter, 1);
						this.showMessageToast("ts.taskScheduler.master.list.deleteTask.success");
						oTaskModel.refresh(true);

					}
				}.bind(this)
			});
		},

		onTaskEditPress: function(oEvent) {
			//get binding context of unassigned task
			var oBindingContext = oEvent.getSource().getBindingContext("tasks");
			//get object for edit
			var oBindingContextObject = oBindingContext.getObject();
			//set data to temporary model
			this.getModel("editModel").setData({
				iconId: oBindingContextObject.iconId,
				TaskName: oBindingContextObject.TaskName,
				StartDate: oBindingContextObject.StartDate,
				Days: oBindingContextObject.Days,
				TaskPath: oBindingContext.getPath()
			});

			this._oEditTaskMDialog.open();
		},

		onPressEditTaskCancel: function(oEvent) {
			this._oEditTaskMDialog.close();
		},

		//method to save new changes in task from unassigned task array
		onPressEditTaskOk: function(oEvent) {
			var oTasksModel = this.getModel("tasks");
			this.onValidateEditTask();
			if (oTasksModel.getProperty("/validateEditTask")) {
				var oEditTaskData = this.getView().getModel("editModel").getData();
				var oTaskData = this.getView().getModel("tasks").getProperty(oEditTaskData.TaskPath);

				oTaskData.Days = oEditTaskData.Days;
				oTaskData.iconId = oEditTaskData.iconId;
				oTaskData.StartDate = oEditTaskData.StartDate ? oEditTaskData.StartDate : new Date(Date.now());
				oTaskData.TaskName = oEditTaskData.TaskName;
				this.showMessageToast("ts.taskScheduler.master.list.editTask.success");
				oTasksModel.refresh(true);
				this._oEditTaskMDialog.close();
			} else {
				this.showMessageToast("ts.taskScheduler.master.list.editTask.fillFields");
			}

		},
		
		//method for assign task to employee dialog ok press
		onPressAssignTaskOk: function(oEvent) {
			var oTasksModel = this.getModel("tasks");
			var oAssignTaskData = this.getView().getModel("assignModel").getData();
			var sSourcePath = oAssignTaskData.DraggedTaskPath;
			var oTargetTaskData = oTasksModel.getProperty(oAssignTaskData.TargetEmployeePath + "/Tasks");
			var oEndDate = this.addDays(oAssignTaskData.StartDate, oAssignTaskData.Days);
			var oTargetObject = {
				Days: oAssignTaskData.Days,
				EndDate: oEndDate,
				StartDate: new Date(oAssignTaskData.StartDate),
				TaskId: oAssignTaskData.TaskId,
				TaskName: oAssignTaskData.TaskName,
				iconId: oAssignTaskData.iconId
			};
			//push task from master list array to chosen employee task array
			oTargetTaskData.push(oTargetObject);
			
			//remove old object from master list
			var aPath = sSourcePath.split("/");
			var iCounter = aPath[aPath.length - 1];
			var oTaskSet = oTasksModel.getProperty("/UnassignedTasks");
			oTaskSet.splice(iCounter, 1);
			this.showMessageToast("ts.taskScheduler.assignTask.success");
			oTasksModel.refresh(true);
			this._oAssignTaskMDialog.close();
		},
		
		
		//add days to start date
		addDays: function(sStartDate, sDays) {
			return new Date(Date.parse(sStartDate) + 24 * 60 * 60 * 1000 * sDays);
		},
		
		onPressAssignTaskCancel: function(oEvent) {
			this._oAssignTaskMDialog.close();
		},
		
		//validation for edit task, same as validateTask method 
		onValidateEditTask: function(oEvent) {
			var oTasksModel = this.getModel("tasks");
			var oControl;
			var oValueState;
			var bIsFilledForm = true;

			this._oEditFormContainerM.getFormElements().forEach(function(oFormElement, iIndex) {

				var bIsEmptyMandatory = false;
				switch (iIndex) {
					case 0:
						oControl = oFormElement.getFields()[0];
						bIsEmptyMandatory = !oControl.getSelectedItem();
						oValueState = bIsEmptyMandatory ? ValueState.Error : ValueState.None;
						oControl.setValueState(oValueState);
						break;
					case 1:
						oControl = oFormElement.getFields()[0];
						bIsEmptyMandatory = !oControl.getValue();
						oValueState = bIsEmptyMandatory ? ValueState.Error : ValueState.None;
						oControl.setValueState(oValueState);
						break;
					case 2:
						var oDatePicker = oFormElement.getFields()[0];
						var bIsEmptyOrWeekendDatePicker = this.validateDateDatePicker(oDatePicker.getValue());
						var oValueStateDatePicker = bIsEmptyOrWeekendDatePicker ? ValueState.Error : ValueState.None;
						oDatePicker.setValueState(oValueStateDatePicker);

						var oDaysInput = oFormElement.getFields()[1];
						var sDaysValue = oDaysInput.getValue();

						var oNumericRegex = /([0-9]([0-9]{0,2})((?=[\.,\,])([\.,\,][0-9]{0,1})))|[1-9]([0-9]{0,2})/;

						var aMatchValue = sDaysValue.match(oNumericRegex);
						var sNewValue = aMatchValue ? aMatchValue[0].replace(",", ".") : null;
						if (sNewValue) {
							oDaysInput.setValue(sNewValue);
						} else {
							oDaysInput.setValue(0.0);
						}
						var bIsEmptyMandatoryosDaysValueInput = parseFloat(oDaysInput.getValue()).toFixed(1) <= "0.0";
						var oValueStateDaysInput = bIsEmptyMandatoryosDaysValueInput ? ValueState.Error : ValueState.None;
						oDaysInput.setValueState(oValueStateDaysInput);

						bIsEmptyMandatory = bIsEmptyOrWeekendDatePicker || bIsEmptyMandatoryosDaysValueInput;
						break;
					default:
						break;
				}
				if (bIsEmptyMandatory) {
					bIsFilledForm = false;
				}
			}.bind(this));
			oTasksModel.setProperty("/validateEditTask", bIsFilledForm);
			oTasksModel.refresh();
		},
		
		//display task in calendar
		onAppointmentSelectDisplay: function(oEvent) {
			var oAppointment = oEvent.getParameter("appointment");
			var oBindingContextObject = oAppointment.getBindingContext("tasks").getObject();
			var sDaysBetween = this.getDaysBeetween(oBindingContextObject.StartDate, oBindingContextObject.EndDate);
			var fDaysBetween = sDaysBetween === "0.0" ? "0.1" : sDaysBetween;
			this.getModel("displayModel").setData({
				TaskName: oBindingContextObject.TaskName,
				StartDate: oBindingContextObject.StartDate,
				Days: fDaysBetween,
				iconId: oBindingContextObject.iconId,
				EmployeeName: oAppointment.getParent().getBindingContext("tasks").getObject().EmployeeName
			});
			this._oDisplayTaskMDialog.open();
		},

		onPressDisplayTaskOk: function(oEvent) {
			this._oDisplayTaskMDialog.close();
		},
		
		
		//resize task in planning calendar
		onAppointmentResize: function(oEvent) {
			var oAppointment = oEvent.getParameter("appointment");
			var oStartDate = oEvent.getParameter("startDate");
			var oEndDate = oEvent.getParameter("endDate");
			var oBindingObject = oAppointment.getBindingContext("tasks").getObject();
			oAppointment.setStartDate(oStartDate).setEndDate(oEndDate);
			oBindingObject.StartDate = oStartDate;
			oBindingObject.EndDate = oEndDate;
		},
		
		//get days beetween start date and end date
		getDaysBeetween: function(oStartDate, oEndDate) {
			var oStartDateMs = (new Date(oStartDate)).getTime();
			var oEndDateMs = (new Date(oEndDate)).getTime();
			return (Math.abs((oStartDateMs - oEndDateMs)) / (1000 * 60 * 60 * 24)).toFixed(1);
		}

	});
});