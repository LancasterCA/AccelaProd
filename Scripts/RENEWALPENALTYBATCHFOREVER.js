// testing parameters, uncomment to use in script test
/*
aa.env.setValue("showDebug","Y");
aa.env.setValue("appGroup","Licenses");
aa.env.setValue("appTypeType","*");
aa.env.setValue("appSubtype","*");
aa.env.setValue("appCategory","*");
aa.env.setValue("expirationStatus","About to Expire");
aa.env.setValue("skipAppStatus","Void,Withdrawn");
aa.env.setValue("emailAddress","chad@esilverliningsolutions.com");
aa.env.setValue("newExpirationStatus","About to Expire");
aa.env.setValue("appStatus","Delinquent");
aa.env.setValue("fromDate","08/15/2017");
aa.env.setValue("toDate","08/15/2017");
aa.env.setValue("daySpan","0");
aa.env.setValue("lookAheadDays","-35");
*/
/*------------------------------------------------------------------------------------------------------/
| Program: Renewal Penalties
| Client:
|
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
maxSeconds = 180 * 60;
/*------------------------------------------------------------------------------------------------------/
| BEGIN Includes
/------------------------------------------------------------------------------------------------------*/
SCRIPT_VERSION = 2.0;

eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_BATCH"));
eval(getScriptText("INCLUDES_CUSTOM"));

overRide = "function logDebug(dstr) { emailText += dstr + '<br>'; }";
eval(overRide);

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
useAppSpecificGroupName = false;
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
var appGroup = getParam("appGroup"); //   app Group to process {Licenses}
var appTypeType = getParam("appTypeType"); //   app type to process {Rental License}
var appSubtype = getParam("appSubtype"); //   app subtype to process {NA}
var appCategory = getParam("appCategory"); //   app category to process {NA}
var expStatus = getParam("expirationStatus"); //   test for this expiration status
var skipAppStatusArray = getParam("skipAppStatus").split(","); //   Skip records with one of these application statuses
var emailAddress = getParam("emailAddress"); // email to send report
var newExpStatus = getParam("newExpirationStatus"); //   update to this expiration status
var appStatus = getParam("appStatus"); //   used to only run for this record status 
var fromDate = getParam("fromDate"); // Hardcoded dates.   Use for testing only
var toDate = getParam("toDate"); // ""
var lookAheadDays = aa.env.getValue("lookAheadDays"); // Number of days from today
var daySpan = aa.env.getValue("daySpan"); // Days to search (6 if run weekly, 0 if daily, etc.)

/*----------------------------------------------------------------------------------------------------/
|
| End: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();

var mailFrom = lookup("ACA_EMAIL_TO_AND_FROM_SETTING", "RENEW_LICENSE_AUTO_ISSUANCE_MAILFROM");
var acaSite = lookup("ACA_CONFIGS", "ACA_SITE");
acaSite = acaSite.substr(0, acaSite.toUpperCase().indexOf("/ADMIN"));

var startTime = startDate.getTime(); // Start timer
var systemUserObj = aa.person.getUser("ADMIN").getOutput();

appGroup = appGroup == "" ? "*" : appGroup;
appTypeType = appTypeType == "" ? "*" : appTypeType;
appSubtype = appSubtype == "" ? "*" : appSubtype;
appCategory = appCategory == "" ? "*" : appCategory;
var appType = appGroup + "/" + appTypeType + "/" + appSubtype + "/" + appCategory;


if (!fromDate.length) { // no "from" date, assume today 
	//fromDate = dateAdd(null, 0);
	fromDate = dateAdd(null, parseInt(lookAheadDays))
}
if (!toDate.length) { // no "to" date, assume today 
	//toDate = fromDate;
	toDate = dateAdd(null, parseInt(lookAheadDays) + parseInt(daySpan))
}

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

logDebug("Start of Job");
logDebug("Max Seconds to Timeout:"+maxSeconds);


try {
	mainProcess();
} catch (err) {
	logDebug("ERROR: " + err.message + " In " + batchJobName + " Line " + err.lineNumber);
	logDebug("Stack: " + err.stack);
}

logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");

aa.eventLog.createEventLog("DEBUG", "Batch Process", batchJobName, aa.date.getCurrentDate(), aa.date.getCurrentDate(),"", emailText, batchJobID);
aa.print(emailText);

var emailDate = aa.date.getCurrentDate().month + "/" + aa.date.getCurrentDate().dayOfMonth + "/" + aa.date.getCurrentDate().year + " " + aa.date.getCurrentDate().hourOfDay + ":" + aa.date.getCurrentDate().minute + ":" + aa.date.getCurrentDate().second;

if (emailAddress.length) {
	aa.sendMail("noreply@accela.com", emailAddress, "", batchJobName + " Results", "Batch Process "+batchJobName+" completed on "+emailDate+"  Please check the batch job logs for more information.");
}



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
	
	if(fromDate.length > 0 && toDate.length > 0 ) {
		var expResult = aa.expiration.getLicensesByDate(expStatus, fromDate, toDate);
	} else {
		var expResult = aa.expiration.getLicensesByStatus(expStatus);		
	}
	
	if (expResult.getSuccess()) {
		myExp = expResult.getOutput();
		logDebug("Processing " + myExp.length + " expiration records");
	} else {
		logDebug("ERROR: Getting Expirations, reason is: " + expResult.getErrorType() + ":" + expResult.getErrorMessage());
		return false
	}

	for (thisExp in myExp) // for each b1expiration (effectively, each license app)
	{
		if (elapsed() > maxSeconds) { // only continue if time hasn't expired
			logDebug("A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.") ;
			timeExpired = true ;
			break;
		}

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

		if (capStatus != appStatus) {
			logDebug(altId + ": Skipping. App status does not equal:" + appStatus);
			continue;
		}
		
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

		if (newExpStatus.length > 0 && b1Status != newExpStatus ) {  
			b1Exp.setExpStatus(newExpStatus);
			aa.expiration.editB1Expiration(b1Exp.getB1Expiration());
			logDebug(altId + ": Update expiration status: " + newExpStatus);
		}
		
		
		// find the renewal record 
		result = aa.cap.getProjectByMasterID(capId, "Renewal", "Incomplete");
		if (result.getSuccess()) {
			partialProjects = result.getOutput();
			if (partialProjects != null && partialProjects.length > 0) {
				projectScriptModel = partialProjects[0];
				if (projectScriptModel != null) {
					renewalCapId = projectScriptModel.getCapID();
					if (renewalCapId) 
						calculateRenewalPenaltyFee(renewalCapId, b1ExpDate, capId);
				}
			}
		}

	}

	aa.print("Total CAPS qualified date range: " + myExp.length);
	logDebug("Ignored due to application type: " + capFilterType);
	logDebug("Ignored due to CAP Status: " + capFilterStatus);
	logDebug("Ignored due to Deactivated CAP: " + capDeactivated);
	logDebug("Total CAPS processed: " + capCount);
	

}
function calculateRenewalPenaltyFee(renewalCapId, b1ExpDate, licCapId) {

	penalizedSubGroup = "PG";
	var feeSchedule = aa.finance.getFeeScheduleByCapID(renewalCapId).getOutput()

	baseFees = new Array();
	baseFees["Taxi Owner"] = "TXIB030";
	baseFees["Vehicle For Hire Owner"] = "TXIB030";
	baseFees["Tow Owner"] = "TOWBR030";
	baseFees["Rental Housing"] = "RNTH050";

	licenseFees = new Array();
	licenseFees["General"] = "GENR010";		// qty is ASI "# of People Working in Lancaster"
	licenseFees["Alcohol"] = "GENR010";		// qty is ASI "# of People Working in Lancaster"
	licenseFees["Internet Lounge"] = "GENR010";		// qty is ASI "# of People Working in Lancaster"
	licenseFees["Newsrack"] = "NWSRCKR010";
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
	licenseFees["Vehicle For Hire Owner"] = "TXIB030";		// qty is ASI "Number of Vehicles
	licenseFees["Tobacco Retailer"] = "TOBCOR010";
	licenseFees["Tow Owner"] = "TOWBR020";

	processingFees = new Array();
	processingFees["General"] = "GENR020";
	processingFees["Alcohol"] = "GENR020";
	processingFees["Internet Lounge"] = "GENR020";
	processingFees["Street Performer"] = "GEN020";
	processingFees["Fortune Teller"] = "FRTL030";
	processingFees["Pawn Shop - Second Hand Dealer"] = "PWN030"
	processingFees["Tobacco Retailer"] = "TOBCO011";
	processingFees["Salon Rental"] = "SRNTLR020"

	SBFees = new Array();
	SBFees["General"] = "GENR030";
	SBFees["Alcohol"] = "GENR030";
	SBFees["Internet Lounge"] = "GENR030";
	SBFees["Newsrack"] = "NWSRCKR020";
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
	SBFees["Vehicle For Hire Owner"] = "TXIBR010";
	SBFees["Tobacco Retailer"] = "TOBCOR020";
	SBFees["Tow Owner"] = "TOWBR010";

	try {

	nonProfit = false;
		licType = "" + appTypeArray[2];
	if (licType == "General" && getAppSpecific("Business Ownership Type", licCapId) == "Non-Profit") nonProfit = true;
	if (licType == "Group Home" && getAppSpecific("Is the Group Home licensed by the State of California?", licCapId) == "Yes") nonProfit = true;

	logDebug("Existing fees : ");
	existingFeeArray = loadFees(renewalCapId);
	for (x in existingFeeArray) {
		thisFee = existingFeeArray[x];
		logDebug(thisFee.code + ":" + thisFee.status + ":" + thisFee.amount);
	}

	logDebug("Expiration date = " + b1ExpDate);
	if (b1ExpDate) {

		var monthsLate = calcMonthsLateForExp(b1ExpDate);
		logDebug("Months late = " + monthsLate);
		loopIndex = 0;
		if (monthsLate > 0) {
			logDebug("License type = " + licType);
			penalizedAmount = 0;
			if (matches(licType, "Rental Housing", "Taxi Owner", "Vehicle For Hire Owner", "Tow Owner")) {
				refFeeItem = getFeeDefByCode(feeSchedule, baseFees[licType]);
				penalizedAmount = parseFloat(refFeeItem.formula);
			}
			else {
				fCount = getFeeCountOnRenewal(licenseFees[licType], renewalCapId);
				penalizedAmount = getSubGrpFeeAmtOnRenewal("PG", "", "", renewalCapId); 
				if (penalizedAmount > 0) penalizedAmount = penalizedAmount / fCount;
			}
			logDebug("Penalized amount = " + penalizedAmount);
			if (penalizedAmount >= 0) {
				removeAllFees(renewalCapId); 		// start over
				while (loopIndex <= monthsLate) {
					// add first instance of license fee, process fee and SB1186 fee
					if (matches(licType, "General", "Group Home")) {
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

					if (!nonProfit && penalizedAmount > 0) {
						if(monthsLate >= (loopIndex + 2) ) addFee("BLPN010","BL_PENALTY","FINAL",penalizedAmount,"N", renewalCapId); // 20%
						if(monthsLate >= (loopIndex + 3) ) addFee("BLPN020","BL_PENALTY","FINAL",penalizedAmount,"N", renewalCapId); // 30%
						if(monthsLate >= (loopIndex + 4) ) addFee("BLPN030","BL_PENALTY","FINAL",penalizedAmount,"N", renewalCapId); // 40%
						if(monthsLate >= (loopIndex + 5) ) addFee("BLPN040","BL_PENALTY","FINAL",penalizedAmount,"N", renewalCapId); // 50%
					}	
					loopIndex += 12;
				}
			}
		}
	}
	} 
	catch (err) { logDebug("Error calculating penalty fee : " + err); }
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

function getSubGrpFeeAmtOnRenewal(subGrp){
	itemCap = capId;
	//Check for a specific status to use, optional argument 1
	var spStatus = "";
	if (arguments.length >= 2) {spStatus = arguments[1]};
	
	//Check for a specific FeeCode to exclude, optional argument 2
	var excludedFeeCode = "";
	if (arguments.length == 3) {excludedFeeCode = arguments[2]};

	if (arguments.length == 4) { itemCap = arguments[3]; }
	
	if (spStatus != "") {
		logDebug("Getting total fees for Sub Group: " + subGrp + "; Having a status of: " + spStatus)
		var runFeeTot = 0
		var feeA = loadFees(itemCap)
		for (x in feeA)	{
			thisFee = feeA[x];
			if (thisFee.subGroup != null) {
				var thisFeeSubGrp = thisFee.subGroup
				var thisFeeSubGrpAry = thisFeeSubGrp.split(",")
				if (IsStrInArry(subGrp,thisFeeSubGrpAry) && (thisFee.status == spStatus)){
					//Check to see if fee should be excluded, if not then count it.
					if (excludedFeeCode == thisFee.code) {
						logDebug("Fee " + thisFee.code + " found with sub group: " + thisFee.subGroup + "; Amount: " + thisFee.amount + "; Status: " + thisFee.status);
						logDebug("Fee " + thisFee.code + " is excluded from the Running Total: " + runFeeTot);
					}
					//excludedFeeCode is not specified, so count all
					else {
						logDebug("Fee " + thisFee.code + " found with sub group: " + thisFee.subGroup + "; Amount: " + thisFee.amount + "; Status: " + thisFee.status );
						runFeeTot = runFeeTot + thisFee.amount;
						logDebug("Fee: " + thisFee.code + " added to the running total. Running Total: " + runFeeTot);
					}
				}
			}
		}
	}
	else {
		logDebug("Getting total fees for Sub Group: " + subGrp + "; Having a status of INVOICED or NEW.")
		var runFeeTot = 0
		var feeA = loadFees(itemCap)
		for (x in feeA)	{
			thisFee = feeA[x];
			if (thisFee.subGroup != null) {
				var thisFeeSubGrp = thisFee.subGroup
				var thisFeeSubGrpAry = thisFeeSubGrp.split(",")
				if (IsStrInArry(subGrp,thisFeeSubGrpAry) && (thisFee.status == "INVOICED" || thisFee.status == "NEW")) {
		         	        if (excludedFeeCode == thisFee.code) {
						logDebug("Fee " + thisFee.code + " found with sub group: " + thisFee.subGroup + "; Amount: " + thisFee.amount + "; Status: " + thisFee.status );
						logDebug("Fee " + thisFee.code + " is excluded from the Running Total: " + runFeeTot);
					}
					//excludedFeeCode is not specified, so count all
					else {
						if (thisFee.description.indexOf("Alternative Energy") < 0) {
							logDebug("Fee " + thisFee.code + " found with sub group: " + thisFee.subGroup + "; Amount: " + thisFee.amount + "; Status: " + thisFee.status );
							runFeeTot = runFeeTot + thisFee.amount;
							logDebug("Fee: " + thisFee.code + " added to the running total. Running Total: " + runFeeTot);
						}
					}
				}
			}
		}
	}
	logDebug("Final returned amount: " + runFeeTot);
	return (runFeeTot);
}

function getFeeCountOnRenewal(fCode, itemCap) {
logDebug("START OF getFeeCountOnRenewal and have fcode:"+fCode+" and itemcap:"+itemCap);
	retValue = 0;
	feeArray = loadFees(itemCap);
	for (fIndex in feeArray) {
		thisFee = feeArray[fIndex];
		var thisSubGrp = "" + thisFee.subGroup;
		var thisFstatus = thisFee.status;
		if ( thisFee.code == fCode && thisSubGrp.indexOf("PG") >= 0 && (thisFee.status == "INVOICED" || thisFee.status == "NEW") ) {
			logDebug("	counting this fee:"+thisFee.code+" the subgroup is:"+thisSubGrp+" the status code is:"+thisFstatus);
			retValue++;
		}
	}
logDebug("END OF getFeeCountOnRenewal...RETURNING->"+retValue+"<-");	
return retValue;
}



function calcMonthsLateForExp(expDate) {
	// calculate the months difference between the exp date and the current date

	date1 = convertDate(expDate);
	//var fDate = convertDate(fileDate); logDebug("fDate: "+fDate);
	var fDate = new Date(); 
	var monthLate = 0;
	var yMonthLate = 0;
	var monthsLate = 0;
	
	if(date1 < fDate){	
		var oMonth = date1.getMonth();
		var oYear = date1.getFullYear();	
		var fDateMonth = fDate.getMonth();
		var fDateYear = fDate.getFullYear();	
		if((oYear < fDateYear) || (oYear == fDateYear && oMonth < fDateMonth)){
			monthLate = (fDateMonth - oMonth); 
			yMonthLate = ((fDateYear - oYear)*12); 
			monthsLate = monthLate+yMonthLate;
		}
		return monthsLate;
	}
	return 0;
}