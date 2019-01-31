// testing parameters, uncomment to use in script test
/*
aa.env.setValue("showDebug","Y");
aa.env.setValue("fromDate","11/20/2016");
aa.env.setValue("toDate","11/21/2016");
aa.env.setValue("appGroup","Licenses");
aa.env.setValue("appTypeType","*");
aa.env.setValue("appSubtype","*");
aa.env.setValue("appCategory","License");
aa.env.setValue("expirationStatus","Active");
aa.env.setValue("newExpirationStatus","About to Expire");
aa.env.setValue("newApplicationStatus","About to Expire");
aa.env.setValue("gracePeriodDays","0");
aa.env.setValue("setPrefix","");
aa.env.setValue("inspSched","");
aa.env.setValue("skipAppStatus","Void,Withdrawn,Inactive");
aa.env.setValue("emailAddress","dhoops@accela.com");
aa.env.setValue("sendEmailToContactTypes","");
aa.env.setValue("emailTemplate","");
aa.env.setValue("deactivateLicense","N");
aa.env.setValue("lockParentLicense","N");
aa.env.setValue("createTempRenewalRecord","Y");
aa.env.setValue("feeSched","");
aa.env.setValue("feeList","");
aa.env.setValue("feePeriod","");
*/
/*------------------------------------------------------------------------------------------------------/
| Program: BATCH_ABOUT_TO_EXPIRE_LICENSE.js  Trigger: Batch
| Client:
|
| Version 1.0 - Base Version. 11/01/08 JHS
| Version 2.0 - Updated for Masters Scripts 2.0  02/13/14 JHS
| Version 2.1 - Updated function addRenewalFees to include fees for Out of Area Contractor record type. 
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
|
| START: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
emailText = "";
message = "";
br = "<br>";
useAppSpecificGroupName = false;
/*------------------------------------------------------------------------------------------------------/
| BEGIN Includes
/------------------------------------------------------------------------------------------------------*/
SCRIPT_VERSION = 2.0;

eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_BATCH"));
eval(getScriptText("INCLUDES_CUSTOM"));

function getScriptText(vScriptName) {
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
	return emseScript.getScriptText() + "";
}

/*------------------------------------------------------------------------------------------------------/
|
| END: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
showDebug = true;
if (String(aa.env.getValue("showDebug")).length > 0) {
	showDebug = aa.env.getValue("showDebug").substring(0, 1).toUpperCase().equals("Y");
}

sysDate = aa.date.getCurrentDate();
batchJobResult = aa.batchJob.getJobID();
batchJobName = "" + aa.env.getValue("BatchJobName");
batchJobID = 0;
if (batchJobResult.getSuccess()) {
	batchJobID = batchJobResult.getOutput();
	logDebug("Batch Job " + batchJobName + " Job ID is " + batchJobID);
} else {
	logDebug("Batch job ID not found " + batchJobResult.getErrorMessage());
}

/*----------------------------------------------------------------------------------------------------/
|
| Start: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var fromDate = getParam("fromDate"); // Hardcoded dates.   Use for testing only
var toDate = getParam("toDate"); // ""
var dFromDate = aa.date.parseDate(fromDate); //
var dToDate = aa.date.parseDate(toDate); //
var lookAheadDays = aa.env.getValue("lookAheadDays"); // Number of days from today
var daySpan = aa.env.getValue("daySpan"); // Days to search (6 if run weekly, 0 if daily, etc.)
var appGroup = getParam("appGroup"); //   app Group to process {Licenses}
var appTypeType = getParam("appTypeType"); //   app type to process {Rental License}
var appSubtype = getParam("appSubtype"); //   app subtype to process {NA}
var appCategory = getParam("appCategory"); //   app category to process {NA}
var expStatus = getParam("expirationStatus"); //   test for this expiration status
var newExpStatus = getParam("newExpirationStatus"); //   update to this expiration status
var newAppStatus = getParam("newApplicationStatus"); //   update the CAP to this status
var gracePeriodDays = getParam("gracePeriodDays"); //	bump up expiration date by this many days
var setPrefix = getParam("setPrefix"); //   Prefix for set ID
var inspSched = getParam("inspSched"); //   Schedule Inspection
var skipAppStatusArray = getParam("skipAppStatus").split(","); //   Skip records with one of these application statuses
var emailAddress = getParam("emailAddress"); // email to send report
var sendEmailToContactTypes = getParam("sendEmailToContactTypes"); // send out emails?
var emailTemplate = getParam("emailTemplate"); // email Template
var deactivateLicense = getParam("deactivateLicense"); // deactivate the LP
var lockParentLicense = getParam("lockParentLicense"); // add this lock on the parent license
var createRenewalRecord = getParam("createTempRenewalRecord"); // create a temporary record
var feeSched = getParam("feeSched"); //
var feeList = getParam("feeList"); // comma delimted list of fees to add
var feePeriod = getParam("feePeriod"); // fee period to use {LICENSE}
/*----------------------------------------------------------------------------------------------------/
|
| End: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
if (!fromDate.length) { // no "from" date, assume today 
	fromDate = dateAdd(null, parseInt(lookAheadDays))
}
if (!toDate.length) { // no "to" date, assume today + number of look ahead days + span
	toDate = dateAdd(null, parseInt(lookAheadDays) + parseInt(daySpan));
}
var mailFrom = lookup("ACA_EMAIL_TO_AND_FROM_SETTING", "RENEW_LICENSE_AUTO_ISSUANCE_MAILFROM");
var acaSite = lookup("ACA_CONFIGS", "ACA_SITE");
acaSite = acaSite.substr(0, acaSite.toUpperCase().indexOf("/ADMIN"));

logDebug("Date Range -- fromDate: " + fromDate + ", toDate: " + toDate)

var startTime = startDate.getTime(); // Start timer
var systemUserObj = aa.person.getUser("ADMIN").getOutput();

appGroup = appGroup == "" ? "*" : appGroup;
appTypeType = appTypeType == "" ? "*" : appTypeType;
appSubtype = appSubtype == "" ? "*" : appSubtype;
appCategory = appCategory == "" ? "*" : appCategory;
var appType = appGroup + "/" + appTypeType + "/" + appSubtype + "/" + appCategory;

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

logDebug("Start of Job");

try {
	mainProcess();
} catch (err) {
	logDebug("ERROR: " + err.message + " In " + batchJobName + " Line " + err.lineNumber);
	logDebug("Stack: " + err.stack);
}

logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");

if (emailAddress.length)
	aa.sendMail("noreply@accela.com", emailAddress, "", batchJobName + " Results", emailText);

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

function mainProcess() {
	var capFilterType = 0;
	var capFilterInactive = 0;
	var capFilterError = 0;
	var capFilterStatus = 0;
	var capDeactivated = 0;
	var capCount = 0;
	var inspDate;
	var setName;
	var setDescription;

	var expResult = aa.expiration.getLicensesByDate(expStatus, fromDate, toDate);

	if (expResult.getSuccess()) {
		myExp = expResult.getOutput();
		logDebug("Processing " + myExp.length + " expiration records");
	} else {
		logDebug("ERROR: Getting Expirations, reason is: " + expResult.getErrorType() + ":" + expResult.getErrorMessage());
		return false
	}

	for (thisExp in myExp) // for each b1expiration (effectively, each license app)
	{
		b1Exp = myExp[thisExp];
		var expDate = b1Exp.getExpDate();
		if (expDate) {
			var b1ExpDate = expDate.getMonth() + "/" + expDate.getDayOfMonth() + "/" + expDate.getYear();
		}
		var b1Status = b1Exp.getExpStatus();
		var renewalCapId = null;

		capId = aa.cap.getCapID(b1Exp.getCapID().getID1(), b1Exp.getCapID().getID2(), b1Exp.getCapID().getID3()).getOutput();

		if (!capId) {
			logDebug("Could not get a Cap ID for " + b1Exp.getCapID().getID1() + "-" + b1Exp.getCapID().getID2() + "-" + b1Exp.getCapID().getID3());
			continue;
		}

		altId = capId.getCustomID();

		logDebug(altId + ": Renewal Status : " + b1Status + ", Expires on " + b1ExpDate);

		var capResult = aa.cap.getCap(capId);

		if (!capResult.getSuccess()) {
			logDebug(altId + ": Record is deactivated, skipping");
			capDeactivated++;
			continue;
		} else {
			var cap = capResult.getOutput();
		}

		var capStatus = cap.getCapStatus();

		appTypeResult = cap.getCapType(); //create CapTypeModel object
		appTypeString = appTypeResult.toString();
		appTypeArray = appTypeString.split("/");

		// Filter by CAP Type
		if (appType.length && !appMatch(appType)) {
			capFilterType++;
			logDebug(altId + ": Application Type does not match")
			continue;
		}

		// Filter by CAP Status
		if (exists(capStatus, skipAppStatusArray)) {
			capFilterStatus++;
			logDebug(altId + ": skipping due to application status of " + capStatus)
			continue;
		}

		capCount++;

		// Create Set
		if (setPrefix != "" && capCount == 1) {
			var yy = startDate.getFullYear().toString().substr(2, 2);
			var mm = (startDate.getMonth() + 1).toString();
			if (mm.length < 2)
				mm = "0" + mm;
			var dd = startDate.getDate().toString();
			if (dd.length < 2)
				dd = "0" + dd;
			var hh = startDate.getHours().toString();
			if (hh.length < 2)
				hh = "0" + hh;
			var mi = startDate.getMinutes().toString();
			if (mi.length < 2)
				mi = "0" + mi;

			var setName = setPrefix.substr(0, 5) + yy + mm + dd + hh + mi;

			setDescription = setPrefix + " : " + startDate.toLocaleString()
				var setCreateResult = aa.set.createSet(setName, setDescription)

				if (setCreateResult.getSuccess()) {
					logDebug("Set ID " + setName + " created for CAPs processed by this batch job.");
				} else {
					logDebug("ERROR: Unable to create new Set ID " + setName + " created for CAPs processed by this batch job.");
				}
		}

		// Actions start here:

		var refLic = getRefLicenseProf(altId); // Load the reference License Professional

		if (refLic && deactivateLicense.substring(0, 1).toUpperCase().equals("Y")) {
			refLic.setAuditStatus("I");
			aa.licenseScript.editRefLicenseProf(refLic);
			logDebug(altId + ": deactivated linked License");
		}

		// update expiration status


		if (newExpStatus.length > 0) {
			b1Exp.setExpStatus(newExpStatus);
			aa.expiration.editB1Expiration(b1Exp.getB1Expiration());
			logDebug(altId + ": Update expiration status: " + newExpStatus);
		}

		// update expiration date based on interval

		if (parseInt(gracePeriodDays) != 0) {
			newExpDate = dateAdd(b1ExpDate, parseInt(gracePeriodDays));
			b1Exp.setExpDate(aa.date.parseDate(newExpDate));
			aa.expiration.editB1Expiration(b1Exp.getB1Expiration());

			logDebug(altId + ": updated CAP expiration to " + newExpDate);
			if (refLic) {
				refLic.setLicenseExpirationDate(aa.date.parseDate(newExpDate));
				aa.licenseScript.editRefLicenseProf(refLic);
				logDebug(altId + ": updated License expiration to " + newExpDate);
			}
		}

		if (sendEmailToContactTypes.length > 0 && emailTemplate.length > 0) {

			var conTypeArray = sendEmailToContactTypes.split(",");
			var conArray = getContactArray(capId);

			logDebug("Have the contactArray");

			for (thisCon in conArray) {
				conEmail = null;
				b3Contact = conArray[thisCon];
				if (exists(b3Contact["contactType"], conTypeArray)) {
					conEmail = b3Contact["email"];
				}

				if (conEmail) {
					emailParameters = aa.util.newHashtable();
					addParameter(emailParameters, "$$altid$$", altId);
					addParameter(emailParameters, "$$acaUrl$$", acaSite + getACAUrl());
					addParameter(emailParameters, "$$businessName$$", cap.getSpecialText());
					addParameter(emailParameters, "$$expirationDate$$", b1ExpDate);

					var capId4Email = aa.cap.createCapIDScriptModel(capId.getID1(), capId.getID2(), capId.getID3());

					var fileNames = [];

					aa.document.sendEmailAndSaveAsDocument(mailFrom, conEmail, "", emailTemplate, emailParameters, capId4Email, fileNames);
					logDebug(altId + ": Sent Email template " + emailTemplate + " to " + b3Contact["contactType"] + " : " + conEmail);
				}
			}
		}

		// update CAP status

		if (newAppStatus.length > 0) {
			updateAppStatus(newAppStatus, "");
			logDebug(altId + ": Updated Application Status to " + newAppStatus);
		}

		// schedule Inspection

		if (inspSched.length > 0) {
			scheduleInspection(inspSched, "1");
			inspId = getScheduledInspId(inspSched);
			if (inspId) {
				autoAssignInspection(inspId);
			}
			logDebug(altId + ": Scheduled " + inspSched + ", Inspection ID: " + inspId);
		}

		// Add to Set

		if (setPrefix != "")
			aa.set.add(setName, capId);

		// lock Parent License

		if (lockParentLicense && lockParentLicense.substring(0, 1).toUpperCase().equals("Y")) {
			licCap = getLicenseCapId("*/*/*/*");
			if (licCap) {
				logDebug(licCap + ": adding Lock : " + lockParentLicense);
				addStdCondition("Suspension", lockParentLicense, licCap);
			} else
				logDebug(altId + ": Can't add Lock, no parent license found");
		}

		// create renewal record and add fees
		if (createRenewalRecord && createRenewalRecord.substring(0, 1).toUpperCase().equals("Y")) {
			createResult = aa.cap.createRenewalRecord(capId);

			if (!createResult.getSuccess) {
				logDebug("Could not create renewal record : " + createResult.getErrorMessage());
			} else {
				renewalCapId = createResult.getOutput();
				aa.print(renewalCapId);

				renewalCap = aa.cap.getCap(renewalCapId).getOutput();
				if (renewalCap.isCompleteCap()) {
					logDebug(altId + ": Renewal Record already exists : " + renewalCapId.getCustomID());
				} else {
					logDebug(altId + ": created Renewal Record " + renewalCapId.getCustomID());

					// add fees

					//if (feeList.length > 0) {
					//	for (var fe in feeList.split(","))
					//		var feObj = addFee(feeList.split(",")[fe], feeSched, feePeriod, 1, "Y", renewalCapId);
					//}
					
					// add renewal fees for lancaster
					if (renewalCapId) {
						addRenewalFees(appTypeArray[2], capId, renewalCapId);
					}
				}
			}
		}
	}

	logDebug("Total CAPS qualified date range: " + myExp.length);
	logDebug("Ignored due to application type: " + capFilterType);
	logDebug("Ignored due to CAP Status: " + capFilterStatus);
	logDebug("Ignored due to Deactivated CAP: " + capDeactivated);
	logDebug("Total CAPS processed: " + capCount);
}

function addRenewalFees(licType, licCapId, renewalCapId) { 
	removeAllFees(renewalCapId);
	var feeSchedule = aa.finance.getFeeScheduleByCapID(renewalCapId).getOutput();
	
	baseFees = new Array();
	baseFees["Taxi Owner"] = "TXIB030";
	baseFees["Vehicle For Hire Owner"] = "TXIB030";
	baseFees["Tow Owner"] = "TOWBR030";
	baseFees["Rental Housing"] = "RNTH050";

	licenseFees = new Array();
	licenseFees["General"] = "GENR010";		// qty is ASI "# of People Working in Lancaster"
	licenseFees["Alcohol"] = "GENR010";		// qty is ASI "# of People Working in Lancaster"
	licenseFees["Internet Lounge"] = "GENR010";		// qty is ASI "# of People Working in Lancaster"
	licenseFees["Newsrack"] = "GENR010";		// qty is ASI "# of People Working in Lancaster"
	licenseFees["Street Performer"] = "GENR010";		// qty is ASI "# of People Working in Lancaster"
	licenseFees["Bingo"] = "BNGOR020";
	licenseFees["Fortune Teller"] = "FRTLR020";
	licenseFees["Group Home"] = "GHR020";
	licenseFees["Massage Business Permit"] = "MSGOR020";
	licenseFees["Massage Technician Permit"] = "MSGTR020"
	licenseFees["Pawn Shop - Second Hand Dealer"] = "PWNR010";
	licenseFees["Rental Housing"] = "RNTHR010";	
	licenseFees["Salon Rental"] = "SRNTLR010";	// uses fee indicator
	licenseFees["Taxi Driver"] = "TAXTOWDR020";
	licenseFees["Vehicle For Hire Driver"] = "TAXTOWDR020";
	licenseFees["Tow Driver"] = "TAXTOWDR020";
	licenseFees["Taxi Owner"] = "TXIBR020";		// qty is ASI "Number of Vehicles
	licenseFees["Vehicle For Hire Operator"] = "TXIB030";		// qty is ASI "Number of Vehicles
	licenseFees["Tobacco Retailer"] = "TOBCOR010";
	licenseFees["Tow Owner"] = "TOWBR020";
	licenseFees["Out of Area Contractor"] = "GENR010"; 		// qty is ASI "# of People Working in Lancaster" 

	processingFees = new Array();
	processingFees["General"] = "GENR020";
	processingFees["Alcohol"] = "GENR020";
	processingFees["Internet Lounge"] = "GENR020";
	processingFees["Newsrack"] = "GENR020";
	processingFees["Street Performer"] = "GEN020";
	processingFees["Fortune Teller"] = "FRTL030";
	processingFees["Pawn Shop - Second Hand Dealer"] = "PWN030"
	processingFees["Tobacco Retailer"] = "TOBCO011";
	processingFees["Salon Rental"] = "SRNTLR020"
	processingFees["Out of Area Contractor"] = "GENR020";

	SBFees = new Array();
	SBFees["General"] = "GENR030";
	SBFees["Alcohol"] = "GENR030";
	SBFees["Internet Lounge"] = "GENR030";
	SBFees["Newsrack"] = "GENR030";
	SBFees["Street Performer"] = "GENR030";
	SBFees["Bingo"] = "BNGOR010";
	SBFees["Fortune Teller"] = "FRTLR010";
	SBFees["Group Home"] = "GHR010";
	SBFees["Massage Business Permit"] = "MSGOR010";
	SBFees["Massage Technician Permit"] = "MSGTR010";
	SBFees["Pawn Shop - Second Hand Dealer"] = "PWNR020";
	SBFees["Rental Housing"] = "RNTHR020";
	SBFees["Salon Rental"] = "SRNTLR030";
	SBFees["Taxi Driver"] = "TAXTOWDR010";
	SBFees["Vehicle For Hire Driver"] = "TAXTOWDR010";
	SBFees["Tow Driver"] = "TAXTOWDR010";
	SBFees["Taxi Owner"] = "TXIBR010";
	SBFees["Vehicle For Hire Operator"] = "TXIBR010";
	SBFees["Tobacco Retailer"] = "TOBCOR020";
	SBFees["Tow Owner"] = "TOWBR010";
	SBFees["Out of Area Contractor"] = "GENR030";

	
	nonProfit = false;
	if (licType == "General" && getAppSpecific("Business Ownership Type", licCapId) == "Non-Profit") nonProfit = true;
	if (licType == "Group Home" && getAppSpecific("Is the Group Home licensed by the State of California?", licCapId) == "Yes") nonProfit = true;

	// add instance of license fee, process fee and SB1186 fee

	if (matches(licType, "General", "Group Home", "Out of Area Contractor")) {
		if (!nonProfit)  { 
			addFeeOnRenewalFromASIOnLicense("# of People Working in Lancaster",licenseFees[licType], renewalCapId, licCapId);
			if (processingFees[licType]) addFee(processingFees[licType], feeSchedule, "FINAL", 1, "N", renewalCapId);
		}
	}
	else {
		if (matches(licType, "Alcohol", "Internet Lounge",  "Street Performer")) {
			addFeeOnRenewalFromASIOnLicense("# of People Working in Lancaster",licenseFees[licType], renewalCapId, licCapId);	
		}
		else {
			if (matches(licType, "Taxi Owner", "Vehicle for Hire Owner")) addFeeOnRenewalFromASIOnLicense("Number of Vehicles (Fee Associated)",licenseFees[licType], renewalCapId, licCapId)
			else {
				if (licType == "Tow Owner") addFeeOnRenewalFromASIOnLicense("Number of Vehicles Operating in Lancaster",licenseFees[licType], renewalCapId, licCapId);
				else addFee(licenseFees[licType], feeSchedule, "FINAL", 1, "N", renewalCapId);
			}
		}
		if (processingFees[licType]) addFee(processingFees[licType], feeSchedule, "FINAL", 1, "N", renewalCapId);
	}
	if (SBFees[licType]) addFee(SBFees[licType], feeSchedule, "FINAL", 1, "N", renewalCapId); 

}


function addFeeOnRenewalFromASIOnLicense(ASIField, FeeCode, renewalCapId, licenseCapId) {
	var tmpASIQty = parseFloat("0" + getAppSpecific(ASIField, licenseCapId))
	if (tmpASIQty ==0) tmpASIQty = 1;
	var FeeSchedule = aa.finance.getFeeScheduleByCapID(renewalCapId).getOutput()
	logDebug("addeFeeFromASI Function: ASI Field = " + ASIField + "; Fee Code = " + FeeCode + "; Fee Schedule: " + FeeSchedule);

	if (arguments.length == 3) FeeSchedule = arguments[2];	// Fee Scheulde for Fee Code
	
	//Check to see if the ASI Field has a value. If so, then check to see if the fee exists.
	if (tmpASIQty >= 0) {
		logDebug("ASI Field: " + ASIField + " was found and has a positive value or zero. Attempting to add fee information.");
		addFee(FeeCode,FeeSchedule,"FINAL",tmpASIQty,"N", renewalCapId);
	}
}



