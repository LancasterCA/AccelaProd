// 07/05/2018: replacing entire file with the one from production environment.  chad has copies of current work

// do not alter this file

/*------------------------------------------------------------------------------------------------------/
| Accela Automation
| Accela, Inc.
| Copyright (C): 2012
|
| Program : INCLUDES_CUSTOM.js
| Event   : N/A
|
| Usage   : Custom Script Include.  Insert custom EMSE Function below and they will be 
|	    available to all master scripts
|
| Notes   :
|
/------------------------------------------------------------------------------------------------------*/


eval( aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput().getScriptByPK(aa.getServiceProviderCode(),"INCLUDES_CUSTOM","ADMIN").getScriptText() + "");
logDebug("----- Loading Custom Script");

function relayPaymentApplyAfter(){
    logDebug("Enter relayPaymentApplyAfter()");
    logDebug("");

    var url = "http://216.64.186.249/lancaster.cayenta.web/api/paymentapply";
    logDebug("url: " + url);

    var login = "login";
    logDebug("login: " + login);

    var password = "password";
    logDebug("password: " + password);

    logDebug("Begin Globals");
    for (variableIndex in this) {
        var variable = this[variableIndex];
        if (typeof variable != "function") {
            logDebug(variableIndex + ":" + variable)
        }
    }
    logDebug("End Globals");
    logDebug("");

    //Echo the environment variables
    logDebug("Begin Environment Variables");
    var paramValues = aa.env.getParamValues();
    var keys = paramValues.keys();
    while (keys.hasNext()) {
        var key = keys.next();
        var value = paramValues.get(key);
        logDebug(key + ":" + value);
    }
    logDebug("End Environment Variables");
    logDebug("");
    
    //Declare local variables that reference the global variables    
    var paymentSequenceNumber = paySeq;
    var capId = capid;
    logDebug("capId: " + capId);

    try{

        //Construct the transaction model that we'll be sending ot the REST endpoint
        var transactionModel = {
            "capId": capId,
            "eventDate": aa.util.now(),
            "appTypeArray" : appTypeArray
        };

        //Add the environment variables
        keys = paramValues.keys();
        while (keys.hasNext()) {
            var key = keys.next();
            var value = paramValues.get(key);
            transactionModel[key] = value;
        }

        //Get the fee schedule
        var getFeeScheduleByCapIDScriptResult = aa.finance.getFeeScheduleByCapID(capId);    
        if(getFeeScheduleByCapIDScriptResult.getSuccess()){
            transactionModel.feeSchedule = getFeeScheduleByCapIDScriptResult.getOutput();
        } else {
            logDebug(getFeeScheduleByCapIDScriptResult.getErrorMessage());
        }

        //Get the fee items
        var getFeeItemByCapIDScriptResult = aa.finance.getFeeItemByCapID(capId);
        if (getFeeItemByCapIDScriptResult.getSuccess()) {
            transactionModel.feeItems = getFeeItemByCapIDScriptResult.getOutput();
        } else {
            logDebug(getFeeItemByCapIDScriptResult.getErrorMessage());
        }

        //Get the payment
        var getPaymentByPKScriptResult = aa.finance.getPaymentByPK(capId, paymentSequenceNumber, currentUserID);
        if(getPaymentByPKScriptResult.getSuccess()){
            transactionModel.payment = getPaymentByPKScriptResult.getOutput();
        } else {
            logDebug(getPaymentByPKScriptResult.getErrorMessage());
        }

        //Get the payment fee items
        var getPaymentFeeItemsScriptResult = aa.finance.getPaymentFeeItems(capId, null);
        if(getPaymentFeeItemsScriptResult.getSuccess()){
            transactionModel.paymentFeeItems = [];
            var paymentFeeItems = getPaymentFeeItemsScriptResult.getOutput();
            for(paymentFeeItemIndex in paymentFeeItems){
                var paymentFeeItem = paymentFeeItems[paymentFeeItemIndex];
                if(paymentFeeItem.getPaymentSeqNbr() == paymentSequenceNumber){
                    transactionModel.paymentFeeItems.push(paymentFeeItem);
                }
            }
        } else {
            logDebug(getPaymentFeeItemsScriptResult.getErrorMessage());
        }

        ////Get the applicant
        //var getCapScriptResult = aa.cap.getCap(capId);
        //if (getCapScriptResult.getSuccess()) {

        //    var capScriptModel = getCapScriptResult.getOutput();
        //    //logDebug("capScriptModel: " + capScriptModel);

        //    var capModel = capScriptModel.getCapModel();
        //    //logDebug("capModel: " + capModel);

        //    //Get the applicant
        //    var applicant = capModel.getApplicantModel();
        //    //logDebug("applicant: " + applicant);

        //    transactionModel.applicant = applicant;
        //}

        //Get the contacts
        var getCapContactByCapIDScriptResult = aa.people.getCapContactByCapID(capId);
        if(getCapContactByCapIDScriptResult.getSuccess()){
            transactionModel.contacts = getCapContactByCapIDScriptResult.getOutput();        
        }else{
            logDebug(getOwnerByCapIdScriptResult.getErrorMessage());
        }

        //Get the owners
        var getOwnerByCapIdScriptResult = aa.owner.getOwnerByCapId(capId);
        if (getOwnerByCapIdScriptResult.getSuccess()) {
            transactionModel.owners = getOwnerByCapIdScriptResult.getOutput();
        } else {
            logDebug(getOwnerByCapIdScriptResult.getErrorMessage());
        }

        //Create an instance of the ObjectMapper that we'll be using for serialization
        var objectMapper = new org.codehaus.jackson.map.ObjectMapper();   

        var transactionModelString = objectMapper.writeValueAsString(transactionModel);
        logDebug("transactionModelString: " + transactionModelString);

        doHttpPostRequest(login, password, url, transactionModelString, "application/json")

    }catch (exception) {

        var subject = "relayPaymentApplyAfter custom script function processing error alert";
        var message = "";

        try { message += "Exception caught in relayPaymentApplyAfter custom script function\n" } catch (_exception) { }
        try { message += "exception: " + exception + "\n"; } catch (_exception) { }
        try { message += "exception.fileName: " + exception.fileName + "\n"; } catch (_exception) { }
        try { message += "exception.lineNumber: " + exception.lineNumber + "\n"; } catch (_exception) { }
        try { message += "exception.message: " + exception.message + "\n"; } catch (_exception) { }
        try { message += "exception.name: " + exception.name + "\n"; } catch (_exception) { }
        try { message += "exception.rhinoException: " + exception.rhinoException + "\n"; } catch (_exception) { }
        try { message += "exception.stack: " + exception.stack + "\n"; } catch (_exception) { }

        logDebug(message);
    }
    aa.env.setValue("ScriptReturnCode", "1");
    aa.env.setValue("ScriptReturnMessage", "relayPaymentApplyAfter()");

    logDebug("");
    logDebug("Exit relayPaymentApplyAfter()");    
}

function relayPaymentRefundAfter(){
    logDebug("Enter relayPaymentRefundAfter()");
    logDebug("");

    var url = "http://216.64.186.249/lancaster.cayenta.web/api/paymentrefund";
    logDebug("url: " + url);

    var login = "login";
    logDebug("login: " + login);

    var password = "password";
    logDebug("password: " + password);

    logDebug("Begin Globals");
    for (variableIndex in this) {
        var variable = this[variableIndex];
        if (typeof variable != "function") {
            logDebug(variableIndex + ":" + variable)
        }
    }
    logDebug("End Globals");
    logDebug("");

    logDebug("Begin Environment Variables");
    var paramValues = aa.env.getParamValues();    
    var keys = paramValues.keys();
    while (keys.hasNext()) {
        var key = keys.next();
        var value = paramValues.get(key);
        logDebug(key + ":" + value);
    }
    logDebug("End Environment Variables");
    logDebug("");
    
    //Declare local variables that reference the global variables    
    var capId = capid;
    logDebug("capId: " + capId);

    try{
        //Construct the transaction model that we'll be sending ot the REST endpoint
        var transactionModel = {
            capId: capid,
            "eventDate": aa.util.now(),
            "appTypeArray" : appTypeArray
        }; 
    
        //Add the environment variables
        keys = paramValues.keys();
        while (keys.hasNext()) {
            var key = keys.next();
            var value = paramValues.get(key);
            transactionModel[key] = value;
        }

        //Get the fee schedule
        var getFeeScheduleByCapIDScriptResult = aa.finance.getFeeScheduleByCapID(capId);
        if (getFeeScheduleByCapIDScriptResult.getSuccess()) {
            transactionModel.feeSchedule = getFeeScheduleByCapIDScriptResult.getOutput();
        } else {
            logDebug(getFeeScheduleByCapIDScriptResult.getErrorMessage());
        }
    
        //Get the fee items
        var getFeeItemByCapIDScriptResult = aa.finance.getFeeItemByCapID(capId);
        if (getFeeItemByCapIDScriptResult.getSuccess()) {
            transactionModel.feeItems = getFeeItemByCapIDScriptResult.getOutput();
        } else {
            logDebug(getFeeItemByCapIDScriptResult.getErrorMessage());
        }

        //Get the payment items
        var getPaymentByCapIDScriptResult = aa.finance.getPaymentByCapID(capId, null);
        if (getPaymentByCapIDScriptResult.getSuccess()) {
            transactionModel.paymentItems = getPaymentByCapIDScriptResult.getOutput();
        } else {
            logDebug(getPaymentByCapIDScriptResult.getErrorMessage());
        }

        //Get the payment fee items
        var getPaymentFeeItemsScriptResult = aa.finance.getPaymentFeeItems(capId, null);
        if (getPaymentFeeItemsScriptResult.getSuccess()) {
            transactionModel.paymentFeeItems = [];
            var paymentFeeItems = getPaymentFeeItemsScriptResult.getOutput();
            for (paymentFeeItemIndex in paymentFeeItems) {
                var paymentFeeItem = paymentFeeItems[paymentFeeItemIndex];            
                transactionModel.paymentFeeItems.push(paymentFeeItem);            
            }
        } else {
            logDebug(getPaymentFeeItemsScriptResult.getErrorMessage());
        }

        ////Get the applicant
        //var getCapScriptResult = aa.cap.getCap(capId);
        //if (getCapScriptResult.getSuccess()) {

        //    var capScriptModel = getCapScriptResult.getOutput();
        //    //logDebug("capScriptModel: " + capScriptModel);

        //    var capModel = capScriptModel.getCapModel();
        //    //logDebug("capModel: " + capModel);

        //    //Get the applicant
        //    var applicant = capModel.getApplicantModel();
        //    //logDebug("applicant: " + applicant);

        //    transactionModel.applicant = applicant;
        //} else {
        //    logDebug(getCapScriptResult.getErrorMessage());
        //}

        //Get the contacts
        var getCapContactByCapIDScriptResult = aa.people.getCapContactByCapID(capId);
        if(getCapContactByCapIDScriptResult.getSuccess()){
            transactionModel.contacts = getCapContactByCapIDScriptResult.getOutput();        
        }else{
            logDebug(getOwnerByCapIdScriptResult.getErrorMessage());
        }

        //Get the owners
        var getOwnerByCapIdScriptResult = aa.owner.getOwnerByCapId(capId);
        if (getOwnerByCapIdScriptResult.getSuccess()) {
            transactionModel.owners = getOwnerByCapIdScriptResult.getOutput();
        } else {
            logDebug(getOwnerByCapIdScriptResult.getErrorMessage());
        }

        //Create an instance of the ObjectMapper that we'll be using for serialization
        var objectMapper = new org.codehaus.jackson.map.ObjectMapper();   

        var transactionModelString = objectMapper.writeValueAsString(transactionModel);
        logDebug("transactionModelString: " + transactionModelString);

        doHttpPostRequest(login, password, url, transactionModelString, "application/json")

    }catch (exception) {

        var subject = "relayPaymentRefundAfter custom script function processing error alert";
        var message = "";

        try { message += "Exception caught in relayPaymentRefundAfter custom script function\n" } catch (_exception) { }
        try { message += "exception: " + exception + "\n"; } catch (_exception) { }
        try { message += "exception.fileName: " + exception.fileName + "\n"; } catch (_exception) { }
        try { message += "exception.lineNumber: " + exception.lineNumber + "\n"; } catch (_exception) { }
        try { message += "exception.message: " + exception.message + "\n"; } catch (_exception) { }
        try { message += "exception.name: " + exception.name + "\n"; } catch (_exception) { }
        try { message += "exception.rhinoException: " + exception.rhinoException + "\n"; } catch (_exception) { }
        try { message += "exception.stack: " + exception.stack + "\n"; } catch (_exception) { }

        logDebug(message);
    }
    aa.env.setValue("ScriptReturnCode", "1");
    aa.env.setValue("ScriptReturnMessage", "relayPaymentRefundAfter()");

    logDebug("");
    logDebug("Exit relayPaymentRefundAfter()");
}

function relayVoidPaymentAfter(){
    logDebug("Enter relayVoidPaymentAfter()");
    logDebug("");

    var url = "http://216.64.186.249/lancaster.cayenta.web/api/paymentvoid";
    logDebug("url: " + url);

    var login = "login";
    logDebug("login: " + login);

    var password = "password";
    logDebug("password: " + password);

    logDebug("Begin Globals");
    for (variableIndex in this) {
        var variable = this[variableIndex];
        if (typeof variable != "function") {
            logDebug(variableIndex + ":" + variable)
        }
    }
    logDebug("End Globals");
    logDebug("");

    logDebug("Begin Environment Variables");
    var paramValues = aa.env.getParamValues();    
    var keys = paramValues.keys();
    while (keys.hasNext()) {
        var key = keys.next();
        var value = paramValues.get(key);
        logDebug(key + ":" + value);
    }
    logDebug("End Environment Variables");
    logDebug("");
    
    //Declare local variables
    var capId = null;

    try{

        //Construct the transaction model that we'll be sending ot the REST endpoint
        var transactionModel = {
            capId: capId,
            "eventDate": aa.util.now(),
            appTypeArray : null
        }; 
    
        //Add the environment variables
        keys = paramValues.keys();
        while (keys.hasNext()) {
            var key = keys.next();
            var value = paramValues.get(key);
            transactionModel[key] = value;
        }

        if (VoidPaymentNbrArray != null && VoidPaymentNbrArray.length > 0) {

            var voidPaymentNbr = VoidPaymentNbrArray[0];
            logDebug("voidPaymentNbr: " + voidPaymentNbr);

            var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
            var datastore = initialContext.lookup("java:/AA");
            var connection = datastore.getConnection();

            var getPaymentsSqlString = "";

            getPaymentsSqlString += "SELECT ";
            getPaymentsSqlString += "	B1_PER_ID1, ";
            getPaymentsSqlString += "	B1_PER_ID2, ";
            getPaymentsSqlString += "	B1_PER_ID3 ";
            getPaymentsSqlString += "FROM ";
            getPaymentsSqlString += "	F4PAYMENT  ";
            getPaymentsSqlString += "WHERE  ";
            getPaymentsSqlString += "	SERV_PROV_CODE = ? ";
            getPaymentsSqlString += "		AND ";
            getPaymentsSqlString += "	PAYMENT_SEQ_NBR = ? ";

            var sqlStatement = connection.prepareStatement(getPaymentsSqlString);

            sqlStatement.setString(1, aa.getServiceProviderCode());
            sqlStatement.setLong(2, voidPaymentNbr);

            var recordset = sqlStatement.executeQuery();
            while (recordset.next()) {

                var B1_PER_ID1 = recordset.getString("B1_PER_ID1");
                var B1_PER_ID2 = recordset.getString("B1_PER_ID2");
                var B1_PER_ID3 = recordset.getString("B1_PER_ID3");            

                capId = aa.cap.getCapID(B1_PER_ID1, B1_PER_ID2, B1_PER_ID3).getOutput();
                transactionModel.capId = capId;
            }

            sqlStatement.close();

            var getCAPSqlString = "";

            getCAPSqlString += "SELECT ";
            getCAPSqlString += "	B1_PER_GROUP, ";
            getCAPSqlString += "	B1_PER_TYPE, ";
            getCAPSqlString += "	B1_PER_SUB_TYPE, ";
            getCAPSqlString += "	B1_PER_CATEGORY ";
            getCAPSqlString += "FROM ";
            getCAPSqlString += "	B1PERMIT  ";
            getCAPSqlString += "WHERE  ";
            getCAPSqlString += "	SERV_PROV_CODE = ? ";
            getCAPSqlString += "		AND ";
            getCAPSqlString += "	B1_PER_ID1 = ? ";
            getCAPSqlString += "		AND ";
            getCAPSqlString += "	B1_PER_ID2 = ? ";
            getCAPSqlString += "		AND ";
            getCAPSqlString += "	B1_PER_ID3 = ? ";

            sqlStatement = connection.prepareStatement(getCAPSqlString);

            //logDebug(capId);

            //logDebug(capId.ID1);
            //logDebug(capId.ID2);
            //logDebug(capId.ID3);

            sqlStatement.setString(1, aa.getServiceProviderCode());
            sqlStatement.setString(2, capId.ID1);
            sqlStatement.setString(3, capId.ID2);
            sqlStatement.setString(4, capId.ID3);

            var recordset = sqlStatement.executeQuery();

            while (recordset.next()) {

                //logDebug(recordset.getString("B1_PER_GROUP"));
                //logDebug(recordset.getString("B1_PER_TYPE"));
                //logDebug(recordset.getString("B1_PER_SUB_TYPE"));
                //logDebug(recordset.getString("B1_PER_CATEGORY"));

                transactionModel.appTypeArray = [
                    recordset.getString("B1_PER_GROUP"),
                    recordset.getString("B1_PER_TYPE"),
                    recordset.getString("B1_PER_SUB_TYPE"),
                    recordset.getString("B1_PER_CATEGORY")
                ];
            }

            sqlStatement.close();
            connection.close();
        }

        if (
            (
                transactionModel.appTypeArray[0] == "Licenses"
                    &&
                transactionModel.appTypeArray[1] == "Business"
                    &&
                transactionModel.appTypeArray[3] == "Application"
            )
                ||
            (
                transactionModel.appTypeArray[0] == "Licenses"
                    &&
                transactionModel.appTypeArray[1] == "Business"
                    &&
                transactionModel.appTypeArray[3] == "Renewal"
            )
                ||
            (transactionModel.appTypeArray[0] == "Permits")
        ) {

            //Get the fee schedule
            var getFeeScheduleByCapIDScriptResult = aa.finance.getFeeScheduleByCapID(capId);
            if (getFeeScheduleByCapIDScriptResult.getSuccess()) {
                transactionModel.feeSchedule = getFeeScheduleByCapIDScriptResult.getOutput();
            } else {
                logDebug(getFeeScheduleByCapIDScriptResult.getErrorMessage());
            }

            //Get the fee items
            var getFeeItemByCapIDScriptResult = aa.finance.getFeeItemByCapID(capId);
            if (getFeeItemByCapIDScriptResult.getSuccess()) {
                transactionModel.feeItems = getFeeItemByCapIDScriptResult.getOutput();
            } else {
                logDebug(getFeeItemByCapIDScriptResult.getErrorMessage());
            }

            //Get the payment items
            var getPaymentByCapIDScriptResult = aa.finance.getPaymentByCapID(capId, null);
            if (getPaymentByCapIDScriptResult.getSuccess()) {
                transactionModel.paymentItems = getPaymentByCapIDScriptResult.getOutput();
            } else {
                logDebug(getPaymentByCapIDScriptResult.getErrorMessage());
            }

            //Get the payment fee items
            var getPaymentFeeItemsScriptResult = aa.finance.getPaymentFeeItems(capId, null);
            if (getPaymentFeeItemsScriptResult.getSuccess()) {
                transactionModel.paymentFeeItems = [];
                var paymentFeeItems = getPaymentFeeItemsScriptResult.getOutput();
                for (paymentFeeItemIndex in paymentFeeItems) {
                    var paymentFeeItem = paymentFeeItems[paymentFeeItemIndex];
                    transactionModel.paymentFeeItems.push(paymentFeeItem);
                }
            } else {
                logDebug(getPaymentFeeItemsScriptResult.getErrorMessage());
            }

            //Get the contacts
            var getCapContactByCapIDScriptResult = aa.people.getCapContactByCapID(capId);
            if (getCapContactByCapIDScriptResult.getSuccess()) {
                transactionModel.contacts = getCapContactByCapIDScriptResult.getOutput();
            } else {
                logDebug(getOwnerByCapIdScriptResult.getErrorMessage());
            }

            //Get the owners
            var getOwnerByCapIdScriptResult = aa.owner.getOwnerByCapId(capId);
            if (getOwnerByCapIdScriptResult.getSuccess()) {
                transactionModel.owners = getOwnerByCapIdScriptResult.getOutput();
            } else {
                logDebug(getOwnerByCapIdScriptResult.getErrorMessage());
            }

            //Create an instance of the ObjectMapper that we'll be using for serialization
            var objectMapper = new org.codehaus.jackson.map.ObjectMapper();

            var transactionModelString = objectMapper.writeValueAsString(transactionModel);
            logDebug("transactionModelString: " + transactionModelString);

            doHttpPostRequest(login, password, url, transactionModelString, "application/json")

        }
    } catch (exception) {

        var subject = "relayVoidPaymentAfter custom script function processing error alert";
        var message = "";

        try { message += "Exception caught in relayVoidPaymentAfter custom script function\n" } catch (_exception) { }
        try { message += "exception: " + exception + "\n"; } catch (_exception) { }
        try { message += "exception.fileName: " + exception.fileName + "\n"; } catch (_exception) { }
        try { message += "exception.lineNumber: " + exception.lineNumber + "\n"; } catch (_exception) { }
        try { message += "exception.message: " + exception.message + "\n"; } catch (_exception) { }
        try { message += "exception.name: " + exception.name + "\n"; } catch (_exception) { }
        try { message += "exception.rhinoException: " + exception.rhinoException + "\n"; } catch (_exception) { }
        try { message += "exception.stack: " + exception.stack + "\n"; } catch (_exception) { }

        aa.debug(subject, message);
        logDebug(message);
    }
    
    aa.env.setValue("ScriptReturnCode", "1");
    aa.env.setValue("ScriptReturnMessage", "relayVoidPaymentAfter()");

    logDebug("");
    logDebug("Exit relayVoidPaymentAfter()");
}

function doHttpPostRequest(username, password, url, body, contentType) {
    logDebug("Enter doHttpPostRequest()");

    logDebug("username: " + username);
    logDebug("password: " + password);
    logDebug("url: " + url);
    logDebug("body: " + body);
    logDebug("contentType: " + contentType);

    var post = new org.apache.commons.httpclient.methods.PostMethod(url);
    var client = new org.apache.commons.httpclient.HttpClient();

    // ---- Authentication ---- //
    if(username !== null && password !== null){
        var creds = new org.apache.commons.httpclient.UsernamePasswordCredentials(username, password);
        client.getParams().setAuthenticationPreemptive(true);
        client.getState().setCredentials(org.apache.commons.httpclient.auth.AuthScope.ANY, creds);
    }
    // -------------------------- //

    post.setRequestHeader("Content-type", contentType);
    
    post.setRequestEntity(
        new org.apache.commons.httpclient.methods.StringRequestEntity(body, contentType, "UTF-8")
    );

    var status = client.executeMethod(post);

    if(status >= 400){
        throw "HTTP Error: " + status;
    }
    
    var br = new java.io.BufferedReader(new java.io.InputStreamReader(post.getResponseBodyAsStream()));
    var response = "";
    var line = br.readLine();
    while(line != null){
        response = response + line;
        line = br.readLine();
    }

    post.releaseConnection();

    logDebug(status);
    logDebug(response);

    logDebug("Exit doHttpPostRequest()");
    return response;
}

function addParameter(pamaremeters, key, value)
{
	if(key != null)
	{
		if(value == null)
		{
			value = "";
		}
		pamaremeters.put(key, value);
	}
}
 

function getRecordParams4Notification(params) {
	// pass in a hashtable and it will add the additional parameters to the table

	addParameter(params, "$$altID$$", capIDString);
	addParameter(params, "$$capName$$", capName);
	addParameter(params, "$$capStatus$$", capStatus);
	addParameter(params, "$$fileDate$$", fileDate);
	addParameter(params, "$$workDesc$$", workDescGet(capId));
	addParameter(params, "$$balanceDue$$", "$" + parseFloat(balanceDue).toFixed(2));
	addParameter(params, "$$capTypeAlias$$", aa.cap.getCap(capId).getOutput().getCapType().getAlias());
	//if (wfComment != null) {
		//addParameter(params, "$$wfComment$$", wfComment);
	//}
	return params;
}

function getPrimaryAddressLineParam4Notification(params) {
	// pass in a hashtable and it will add the additional parameters to the table

    var addressLine = "";
	adResult = aa.address.getPrimaryAddressByCapID(capId,"Y");
	if (adResult.getSuccess()) {
		ad = adResult.getOutput().getAddressModel();
		addParameter(params, "$$addressLine$$", ad.getDisplayAddress());
	}
	return params;
}


function getContactParams4Notification(params,conType) {
	// pass in a hashtable and it will add the additional parameters to the table
	// pass in contact type to retrieve

	contactArray = getContactArray();

	for(ca in contactArray) {
		thisContact = contactArray[ca];

		if (thisContact["contactType"] == conType) {

			conType = conType.toLowerCase();

			addParameter(params, "$$" + conType + "LastName$$", thisContact["lastName"]);
			addParameter(params, "$$" + conType + "FirstName$$", thisContact["firstName"]);
			addParameter(params, "$$" + conType + "MiddleName$$", thisContact["middleName"]);
			addParameter(params, "$$" + conType + "BusinesName$$", thisContact["businessName"]);
			addParameter(params, "$$" + conType + "ContactSeqNumber$$", thisContact["contactSeqNumber"]);
			addParameter(params, "$$" + conType + "$$", thisContact["contactType"]);
			addParameter(params, "$$" + conType + "Relation$$", thisContact["relation"]);
			addParameter(params, "$$" + conType + "Phone1$$", thisContact["phone1"]);
			addParameter(params, "$$" + conType + "Phone2$$", thisContact["phone2"]);
			addParameter(params, "$$" + conType + "Email$$", thisContact["email"]);
			addParameter(params, "$$" + conType + "AddressLine1$$", thisContact["addressLine1"]);
			addParameter(params, "$$" + conType + "AddressLine2$$", thisContact["addressLine2"]);
			addParameter(params, "$$" + conType + "City$$", thisContact["city"]);
			addParameter(params, "$$" + conType + "State$$", thisContact["state"]);
			addParameter(params, "$$" + conType + "Zip$$", thisContact["zip"]);
			addParameter(params, "$$" + conType + "Fax$$", thisContact["fax"]);
			addParameter(params, "$$" + conType + "Notes$$", thisContact["notes"]);
			addParameter(params, "$$" + conType + "Country$$", thisContact["country"]);
			addParameter(params, "$$" + conType + "FullName$$", thisContact["fullName"]);
		}
	}
	return params;	
}


function getInspectionResultParams4Notification(params) {

	// pass in a hashtable and it will add the additional parameters to the table
	// This should be called from InspectionResultAfter Event
	if (inspId) addParameter(params, "$$inspId$$", inspId);
	if (inspResult) addParameter(params, "$$inspResult$$", inspResult);
	//if (inspResultComment) addParameter(params, "$$inspResultComment$$", inspResultComment);
	if (inspComment) addParameter(params, "$$inspComment$$", inspComment);
	if (inspResultDate) addParameter(params, "$$inspResultDate$$", inspResultDate);
	if (inspGroup) addParameter(params, "$$inspGroup$$", inspGroup);
	if (inspType) addParameter(params, "$$inspType$$", inspType);
	if (inspSchedDate) addParameter(params, "$$inspSchedDate$$", inspSchedDate);

	return params;

}


function sendNotification(emailFrom,emailTo,emailCC,templateName,params,reportFile)
{
	var id1 = capId.ID1;
 	var id2 = capId.ID2;
 	var id3 = capId.ID3;

	var capIDScriptModel = aa.cap.createCapIDScriptModel(id1, id2, id3);


	var result = null;
	result = aa.document.sendEmailAndSaveAsDocument(emailFrom, emailTo, emailCC, templateName, params, capIDScriptModel, reportFile);
	if(result.getSuccess())
	{
		logDebug("Sent email successfully!");
		return true;
	}
	else
	{
		logDebug("Failed to send mail. - " + result.getErrorType());
		return false;
	}
}
