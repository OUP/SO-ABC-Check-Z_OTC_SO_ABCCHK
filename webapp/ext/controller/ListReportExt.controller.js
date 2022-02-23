sap.ui.define(
    [
        "sap/ui/core/Fragment",
        "sap/m/MessageBox"
    ],
    function (
        Fragment,
        MessageBox
    ) {
        "use strict";

        let _sDefferedGroupId = 'defferedActionGroup';
        let _aAction = null;
        let _oDate = null;
        let _oTable = null;

        sap.ui.controller("oup.otc.zotcsoabcchk.zotcsoabcchk.ext.controller.ListReportExt", {

            onApprove: function (oEvent) {
                _oTable = oEvent.getSource().getParent().getParent();
                this._onAction(true /* Approve */);
            },

            onReject: function (oEvent) {
                _oTable = oEvent.getSource().getParent().getParent();
                this._onAction(false /* Reject */);
            },

            ////////////////////////
            // internal functions //
            ////////////////////////

            _onAction: function (bApprove) {
                if (bApprove) {
                    _aAction = "Approve";
                } else {
                    _aAction = "Reject";
                }

                if (!this._pDialogABCCheckDate) {
                    this._pDialogABCCheckDate = Fragment.load({
                        id: this.getView().getId(),
                        name: "oup.otc.zotcsoabcchk.zotcsoabcchk.ext.fragment.SOABCNextCheckDate",
                        controller: this
                    }).then(function (oDialog) {
                        //oDialog.setModel(oView.getModel());
                        return oDialog;
                    });
                }

                this._pDialogABCCheckDate.then(function (oDialog) {
                    let aDate = new Date();
                    aDate.setDate(aDate.getDate() + 365);
                    oDialog.open();
                    this.getView().byId("ABCCheckDateField").setDateValue(aDate);
                }.bind(this));
            },

            onOKPressed: function () {
                _oDate = this.getView().byId("ABCCheckDateField").getDateValue();
                this._pDialogABCCheckDate.then(function (oDialog) {
                    oDialog.close();
                }.bind(this));
                this._callBatchOpreation(_oTable, _aAction);
            },

            onCancelPressed: function () {
                this._pDialogABCCheckDate.then(function (oDialog) {
                    //	this._configDialog(oButton, oDialog);
                    oDialog.close();
                }.bind(this));
            },

            _callBatchOpreation: function (oTable, aAction) {
                let oDataModel = this.oView.getModel();
                let oModelTable = this.oView.getModel();
                let oSelItems = oTable.getSelectedItems();
                let aHours = _oDate.getHours();
                if (aHours === 0) {
                    _oDate.setHours(12);
                }
                let oEntity = {};

                oDataModel.setHeaders({
                    "Action": aAction
                });

                oDataModel.setDeferredGroups([_sDefferedGroupId]);
                
                // success function
                const fnSuccess = (oData, _oResponse) => {
                    let hdrMessage;
                    let hdrMessageObject;
                    _oTable.removeSelections();
                    oModelTable.refresh();

                    try {
                        let len = oData.__batchResponses[0].__changeResponses.length;
                        hdrMessage = oData.__batchResponses[0].__changeResponses[len - 1].headers["sap-message"];
                        hdrMessageObject = JSON.parse(hdrMessage);

                    } catch (error) {
                        console.log(error);

                    }
                    let aMessages = "<ul><li>";
                    aMessages = aMessages + hdrMessageObject.message + "</li>";

                    for (let i = 0; i < hdrMessageObject.details.length; i++) {
                        aMessages = aMessages + "<li>" + hdrMessageObject.details[i].message + "</li>";
                    }

                    aMessages = aMessages + "</ul>";

                    // log the header message
                    MessageBox.information("Information", {
                        title: "Information",
                        details: aMessages,
                        contentWidth: "150px"
                    });

                };

                // error function
                const fnFail = (_oError) => {
                    MessageBox.error("Backend Error Please Connect to Admin");
                };

                // parameters for the odata service
                const mParameters = {
                    groupId: _sDefferedGroupId,
                    success: fnSuccess,
                    error: fnFail
                };

                for (let i = 0; i < oSelItems.length; i++) {
                    let sPath = oSelItems[i].getBindingContextPath();
                    let mParametersUpdate = {
                        groupId: _sDefferedGroupId,
                        "If-Match": this.getView().getModel().getProperty(sPath).__metadata.etag
                    };
                    oEntity = {
                        "NextCheckDateforABC": _oDate
                    };
                    oDataModel.update(sPath, oEntity, mParametersUpdate);
                }

                // trigger backend call
                oDataModel.submitChanges(mParameters);
            }

        });
    });
