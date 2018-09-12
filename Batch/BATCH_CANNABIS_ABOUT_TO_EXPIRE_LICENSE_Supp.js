// testing parameters, uncomment to use in script test--
/*
aa.env.setValue("showDebug","Y");
aa.env.setValue("fromDate","8/18/2018");
aa.env.setValue("toDate","8/18/2018");
aa.env.setValue("appGroup","Licenses");
aa.env.setValue("appTypeType","Cannabis");
aa.env.setValue("appSubtype","*");
aa.env.setValue("appCategory","License");
aa.env.setValue("expirationStatus","Active");
aa.env.setValue("newExpirationStatus","About to Expire");
aa.env.setValue("newApplicationStatus","About to Expire");
aa.env.setValue("gracePeriodDays","0");
aa.env.setValue("setPrefix","");
aa.env.setValue("inspSched","");
aa.env.setValue("skipAppStatus","Void,Withdrawn,Inactive");
aa.env.setValue("emailAddress","chad@esilverliningsolutions.com");
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
| Program: BATCH_CANNABIS_ABOUT_TO_EXPIRE_LICENSE.js  Trigger: Batch
| Client:
|
| Version 1.0 - Base Version. 11/01/08 JHS
| Version 2.0 - Updated for Masters Scripts 2.0  02/13/14 JHS
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
aa.env.setValue("CurrentUserID","ADMIN");
var currentUserID = "ADMIN"
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

			// create a cap
			logDebug("creating a new cap with:");
			logDebug("appTypeArray[0]="+appTypeArray[0]);
			logDebug("appTypeArray[1]"+appTypeArray[1]);
			logDebug("appTypeArray[2]"+appTypeArray[2]);
			logDebug("but last part is Renewal");
			var renewalCapId = createChild(appTypeArray[0],appTypeArray[1],appTypeArray[2],"Renewal","Renewal License", capId);
			logDebug("created a child record of:"+capId);
			logDebug("new child record is:"+renewalCapId);
			printObjProperties(renewalCapId);

			logDebug("creating a project child");
			var aProjChili = aa.cap.addProjectChild(capId, renewalCapId);
			printObjProperties(aProjChili);
			logDebug("-------------------------------------")

			// copy the key info
			logDebug("copying key info.....");
			copyKeyInfo(capId, renewalCapId);

			// Now update the relationship and status
			var projList = aa.cap.getProjectByChildCapID(renewalCapId, "R", "");
			var thisProj = projList.getOutput()[0];
			printObjProperties(thisProj);

			thisProj.setRelationShip("Renewal");
			thisProj.setStatus("Incomplete");

			var rezult = aa.cap.updateProject(thisProj);
			printObjProperties(rezult);

			// add fees

			//if (feeList.length > 0) {
			//	for (var fe in feeList.split(","))
			//		var feObj = addFee(feeList.split(",")[fe], feeSched, feePeriod, 1, "Y", renewalCapId);
			//}
			
			// add renewal fees for lancaster
			if (renewalCapId) {
				addRenewalFees(appTypeArray[2], capId, renewalCapId);
			}
			
			//Now place a hold on all child related records that are about to expire and have a renewal started
			placeConditionOnRelatedNotCompleteRenewals(capId);
			
		}
	}  // for loop 

	logDebug("Total CAPS qualified date range: " + myExp.length);
	logDebug("Ignored due to application type: " + capFilterType);
	logDebug("Ignored due to CAP Status: " + capFilterStatus);
	logDebug("Ignored due to Deactivated CAP: " + capDeactivated);
	logDebug("Total CAPS processed: " + capCount);
}

function addRenewalFees(licType, licCapId, renewalCapId) { 
	removeAllFees(renewalCapId);
	var feeSchedule = aa.finance.getFeeScheduleByCapID(renewalCapId).getOutput();

	renewalFees = new Array();
	renewalFees["Primary"] = "MCLR010";							
	renewalFees["Tenant"] = "MTLR010";							
	renewalFees["Employee"] = "MELR010";						

	siteRegFees = new Array();								
	siteRegFees["Primary"] = "MCLR020";						// qty is ASI "Square Footage (SQFT) of Your Business"

	cultivationFees = new Array();
	cultivationFees["Primary"] = "MCLR030";					// qty is ASI "Total Square Foot of Canopy"

	SBFees = new Array();
	SBFees["Primary"] = "MCLR050";							
	SBFees["Tenant"] = "MTLR030";
	SBFees["Employee"] = "MELR20";
	
	FOGFees = new Array();
	FOGFees["Primary"] = "MCLR040";							//Assessed if "Manufacturing" = Checked
	FOGFees["Tenant"] = "MTLR020";							//Assessed if "Manufacturing" = Checked
	
	// add instance of license fee, process fee and SB1186 fee
	
	if (matches(licType, "Primary")) {
		
		addFeeOnRenewalFromASIOnLicense("Square Footage (SQFT) of Your Business",siteRegFees[licType], renewalCapId, licCapId);
		if (renewalFees[licType]){ 
			addFee(renewalFees[licType], feeSchedule, "FINAL", 1, "N", renewalCapId);
		}
		mfgASI = getAppSpecific("Manufacturing",renewalCapId);
		cnpyASI = getAppSpecific("Cultivation",renewalCapId);
		
		if(mfgASI != null) {
			addFee(FOGFees[licType], feeSchedule, "FINAL", 1, "N", renewalCapId);
		}
		if(cnpyASI != null) {
			addFeeOnRenewalFromASIOnLicense("Total Square Foot of Canopy",cultivationFees[licType], renewalCapId, licCapId);
		}
	}
	if (matches(licType, "Tenant")) {
			if (renewalFees[licType]) addFee(renewalFees[licType], feeSchedule, "FINAL", 1, "N", renewalCapId);
			
			tenMfgASI = getAppSpecific("Manufacturing",renewalCapId);
			if(tenMfgASI != null) {
				addFee(FOGFees[licType], feeSchedule, "FINAL", 1, "N", renewalCapId);
			}
	}
	if (matches(licType, "Employee")) {
			if (renewalFees[licType]) addFee(renewalFees[licType], feeSchedule, "FINAL", 1, "N", renewalCapId);
	}

	
	if (SBFees[licType]) addFee(SBFees[licType], feeSchedule, "FINAL", 1, "N", renewalCapId); 
}


function addFeeOnRenewalFromASIOnLicense(ASIField, FeeCode, renewalCapId, licenseCapId) {
	var tmpASIQty = parseFloat("0" + getAppSpecific(ASIField, licenseCapId))
	if (tmpASIQty > 0); //tmpASIQty = 1;
	var FeeSchedule = aa.finance.getFeeScheduleByCapID(renewalCapId).getOutput()
	logDebug("addeFeeFromASI Function: ASI Field = " + ASIField + "; Fee Code = " + FeeCode + "; Fee Schedule: " + FeeSchedule);

	if (arguments.length == 3) FeeSchedule = arguments[2];	// Fee Scheulde for Fee Code
	
	//Check to see if the ASI Field has a value. If so, then check to see if the fee exists.
	if (tmpASIQty > 0) {
		logDebug("ASI Field: " + ASIField + " was found and has a positive value or zero. Attempting to add fee information.");
		addFee(FeeCode,FeeSchedule,"FINAL",tmpASIQty,"N", renewalCapId);
	}
}

function printObjProperties(obj){
    var idx;

    if(obj.getClass != null){
        aa.print("************* " + obj.getClass() + " *************");
    }
	else {
		aa.print("this is not an object with a class!");
	}

    for(idx in obj){
        if (typeof (obj[idx]) == "function") {
            try {
                aa.print(idx + "==>  " + obj[idx]());
            } catch (ex) { }
        } else {
            aa.print(idx + ":  " + obj[idx]);
        }
    }
}

// ********************************* adding new from applicatonsubmitafter4renew ******

function copyKeyInfo(srcCapId, targetCapId)
{
	//copy ASI infomation
	var AppSpecInfo = new Array();
	loadAppSpecific(AppSpecInfo,srcCapId);
	var recordType = "";
	
	var targetCapResult = aa.cap.getCap(targetCapId);

	if (!targetCapResult.getSuccess()) {
			logDebug("Could not get target cap object: " + targetCapId);
		}
	else	{
		var targetCap = targetCapResult.getOutput();
			targetAppType = targetCap.getCapType();		//create CapTypeModel object
			targetAppTypeString = targetAppType.toString();
			logDebug(targetAppTypeString);
		}

	var ignore = lookup("EMSE:ASI Copy Exceptions",targetAppTypeString); 
	var ignoreArr = new Array(); 
	if(ignore != null) 
	{
		ignoreArr = ignore.split("|");
		copyAppSpecificRenewal(AppSpecInfo,targetCapId, ignoreArr);
	}
	else
	{
		logDebug("something");
		copyAppSpecificRenewal(AppSpecInfo,targetCapId);

	}
	//copy License infomation
	copyLicensedProf(srcCapId, targetCapId);
	//copy Address infomation
	copyAddress(srcCapId, targetCapId);
	//copy AST infomation
	copyASITables(srcCapId, targetCapId);
	//copy Parcel infomation
	copyParcel(srcCapId, targetCapId);
	//copy People infomation
	//copyPeople(srcCapId, targetCapId);
//	copyContactsWithAddresses(srcCapId, targetCapId);
	//copy Owner infomation
//	copyOwner(srcCapId, targetCapId);
	//Copy CAP condition information
	copyCapCondition(srcCapId, targetCapId);
	//Copy additional info.
	copyAdditionalInfo(srcCapId, targetCapId);
	
	editAppName(getAppName(srcCapId),targetCapId);
}

function getAppName() {
    var itemCap = capId;
    if (arguments.length == 1) itemCap = arguments[0]; // use cap ID specified in args

    capResult = aa.cap.getCap(itemCap)

    if (!capResult.getSuccess())
    { logDebug("**WARNING: error getting cap : " + capResult.getErrorMessage()); return false }

    capModel = capResult.getOutput().getCapModel()

    return capModel.getSpecialText()
}
function copyEducation(srcCapId, targetCapId)
{
	if(srcCapId != null && targetCapId != null)
	{
		aa.education.copyEducationList(srcCapId, targetCapId);
	}
}

function copyContEducation(srcCapId, targetCapId)
{
	if(srcCapId != null && targetCapId != null)
	{
		aa.continuingEducation.copyContEducationList(srcCapId, targetCapId);
	}
}

function copyExamination(srcCapId, targetCapId)
{
	if(srcCapId != null && targetCapId != null)
	{
		aa.examination.copyExaminationList(srcCapId, targetCapId);
	}
}

function copyAddress(srcCapId, targetCapId)
{
	//1. Get address with source CAPID.
	var capAddresses = getAddress(srcCapId);
	if (capAddresses == null || capAddresses.length == 0)
	{
		return;
	}
	//2. Get addresses with target CAPID.
	var targetAddresses = getAddress(targetCapId);
	//3. Check to see which address is matched in both source and target.
	for (loopk in capAddresses)
	{
		sourceAddressfModel = capAddresses[loopk];
		//3.1 Set target CAPID to source address.
		sourceAddressfModel.setCapID(targetCapId);
		targetAddressfModel = null;
		//3.2 Check to see if sourceAddress exist.
		if (targetAddresses != null && targetAddresses.length > 0)
		{
			for (loop2 in targetAddresses)
			{
				if (isMatchAddress(sourceAddressfModel, targetAddresses[loop2]))
				{
					targetAddressfModel = targetAddresses[loop2];
					break;
				}
			}
		}
		//3.3 It is a matched address model.
		if (targetAddressfModel != null)
		{
		
			//3.3.1 Copy information from source to target.
			aa.address.copyAddressModel(sourceAddressfModel, targetAddressfModel);
			//3.3.2 Edit address with source address information. 
			aa.address.editAddressWithAPOAttribute(targetCapId, targetAddressfModel);
			logDebug("Copying address");
		}
		//3.4 It is new address model.
		else
		{	
			//3.4.1 Create new address.
			logDebug("Copying address");
			aa.address.createAddressWithAPOAttribute(targetCapId, sourceAddressfModel);
		}
	}
}

function isMatchAddress(addressScriptModel1, addressScriptModel2)
{
	if (addressScriptModel1 == null || addressScriptModel2 == null)
	{
		return false;
	}
	var streetName1 = addressScriptModel1.getStreetName();
	var streetName2 = addressScriptModel2.getStreetName();
	if ((streetName1 == null && streetName2 != null) 
		|| (streetName1 != null && streetName2 == null))
	{
		return false;
	}
	if (streetName1 != null && !streetName1.equals(streetName2))
	{
		return false;
	}
	return true;
}

function getAddress(capId)
{
	capAddresses = null;
	var s_result = aa.address.getAddressByCapId(capId);
	if(s_result.getSuccess())
	{
		capAddresses = s_result.getOutput();
		if (capAddresses == null || capAddresses.length == 0)
		{
			logDebug("WARNING: no addresses on this CAP:" + capId);
			capAddresses = null;
		}
	}
	else
	{
		logDebug("ERROR: Failed to address: " + s_result.getErrorMessage());
		capAddresses = null;	
	}
	return capAddresses;
}

function copyParcel(srcCapId, targetCapId)
{
	//1. Get parcels with source CAPID.
	var copyParcels = getParcel(srcCapId);
	if (copyParcels == null || copyParcels.length == 0)
	{
		return;
	}
	//2. Get parcel with target CAPID.
	var targetParcels = getParcel(targetCapId);
	//3. Check to see which parcel is matched in both source and target.
	for (i = 0; i < copyParcels.size(); i++)
	{
		sourceParcelModel = copyParcels.get(i);
		//3.1 Set target CAPID to source parcel.
		sourceParcelModel.setCapID(targetCapId);
		targetParcelModel = null;
		//3.2 Check to see if sourceParcel exist.
		if (targetParcels != null && targetParcels.size() > 0)
		{
			for (j = 0; j < targetParcels.size(); j++)
			{
				if (isMatchParcel(sourceParcelModel, targetParcels.get(j)))
				{
					targetParcelModel = targetParcels.get(j);
					break;
				}
			}
		}
		//3.3 It is a matched parcel model.
		if (targetParcelModel != null)
		{
			//3.3.1 Copy information from source to target.
			var tempCapSourceParcel = aa.parcel.warpCapIdParcelModel2CapParcelModel(targetCapId, sourceParcelModel).getOutput();
			var tempCapTargetParcel = aa.parcel.warpCapIdParcelModel2CapParcelModel(targetCapId, targetParcelModel).getOutput();
			aa.parcel.copyCapParcelModel(tempCapSourceParcel, tempCapTargetParcel);
			//3.3.2 Edit parcel with sourceparcel. 
			aa.parcel.updateDailyParcelWithAPOAttribute(tempCapTargetParcel);
		}
		//3.4 It is new parcel model.
		else
		{
			//3.4.1 Create new parcel.
			aa.parcel.createCapParcelWithAPOAttribute(aa.parcel.warpCapIdParcelModel2CapParcelModel(targetCapId, sourceParcelModel).getOutput());
		}
	}
}

function isMatchParcel(parcelScriptModel1, parcelScriptModel2)
{
	if (parcelScriptModel1 == null || parcelScriptModel2 == null)
	{
		return false;
	}
	if (parcelScriptModel1.getParcelNumber().equals(parcelScriptModel2.getParcelNumber()))
	{
		return true;
	}
	return	false;
}

function getParcel(capId)
{
	capParcelArr = null;
	var s_result = aa.parcel.getParcelandAttribute(capId, null);
	if(s_result.getSuccess())
	{
		capParcelArr = s_result.getOutput();
		if (capParcelArr == null || capParcelArr.length == 0)
		{
			logDebug("WARNING: no parcel on this CAP:" + capId);
			capParcelArr = null;
		}
	}
	else
	{
		logDebug("ERROR: Failed to parcel: " + s_result.getErrorMessage());
		capParcelArr = null;	
	}
	return capParcelArr;
}

function copyPeople(srcCapId, targetCapId)
{
	//1. Get people with source CAPID.
	var capPeoples = getPeople(srcCapId);
	if (capPeoples == null || capPeoples.length == 0)
	{
		return;
	}
	//2. Get people with target CAPID.
	var targetPeople = getPeople(targetCapId);
	//3. Check to see which people is matched in both source and target.
	for (loopk in capPeoples)
	{
		sourcePeopleModel = capPeoples[loopk];
		//3.1 Set target CAPID to source people.
		sourcePeopleModel.getCapContactModel().setCapID(targetCapId);
		targetPeopleModel = null;
		//3.2 Check to see if sourcePeople exist.
		if (targetPeople != null && targetPeople.length > 0)
		{
			for (loop2 in targetPeople)
			{
				if (isMatchPeople(sourcePeopleModel, targetPeople[loop2]))
				{
					targetPeopleModel = targetPeople[loop2];
					break;
				}
			}
		}
		//3.3 It is a matched people model.
		if (targetPeopleModel != null)
		{
			//3.3.1 Copy information from source to target.
			aa.people.copyCapContactModel(sourcePeopleModel.getCapContactModel(), targetPeopleModel.getCapContactModel());
			//3.3.2 Edit People with source People information. 
			aa.people.editCapContactWithAttribute(targetPeopleModel.getCapContactModel());
		}
		//3.4 It is new People model.
		else
		{
			//3.4.1 Create new people.
			aa.people.createCapContactWithAttribute(sourcePeopleModel.getCapContactModel());
		}
	}
}

function isMatchPeople(capContactScriptModel, capContactScriptModel2)
{
	if (capContactScriptModel == null || capContactScriptModel2 == null)
	{
		return false;
	}
	var contactType1 = capContactScriptModel.getCapContactModel().getPeople().getContactType();
	var contactType2 = capContactScriptModel2.getCapContactModel().getPeople().getContactType();
	var firstName1 = capContactScriptModel.getCapContactModel().getPeople().getFirstName();
	var firstName2 = capContactScriptModel2.getCapContactModel().getPeople().getFirstName();
	var lastName1 = capContactScriptModel.getCapContactModel().getPeople().getLastName();
	var lastName2 = capContactScriptModel2.getCapContactModel().getPeople().getLastName();
	var fullName1 = capContactScriptModel.getCapContactModel().getPeople().getFullName();
	var fullName2 = capContactScriptModel2.getCapContactModel().getPeople().getFullName();
	if ((contactType1 == null && contactType2 != null) 
		|| (contactType1 != null && contactType2 == null))
	{
		return false;
	}
	if (contactType1 != null && !contactType1.equals(contactType2))
	{
		return false;
	}
	if ((firstName1 == null && firstName2 != null) 
		|| (firstName1 != null && firstName2 == null))
	{
		return false;
	}
	if (firstName1 != null && !firstName1.equals(firstName2))
	{
		return false;
	}
	if ((lastName1 == null && lastName2 != null) 
		|| (lastName1 != null && lastName2 == null))
	{
		return false;
	}
	if (lastName1 != null && !lastName1.equals(lastName2))
	{
		return false;
	}
	if ((fullName1 == null && fullName2 != null) 
		|| (fullName1 != null && fullName2 == null))
	{
		return false;
	}
	if (fullName1 != null && !fullName1.equals(fullName2))
	{
		return false;
	}
	return	true;
}

function getPeople(capId)
{
	capPeopleArr = null;
	var s_result = aa.people.getCapContactByCapID(capId);
	if(s_result.getSuccess())
	{
		capPeopleArr = s_result.getOutput();
		if (capPeopleArr == null || capPeopleArr.length == 0)
		{
			logDebug("WARNING: no People on this CAP:" + capId);
			capPeopleArr = null;
		}
	}
	else
	{
		logDebug("ERROR: Failed to People: " + s_result.getErrorMessage());
		capPeopleArr = null;	
	}
	return capPeopleArr;
}

function copyOwner(srcCapId, targetCapId)
{
	//1. Get Owners with source CAPID.
	var capOwners = getOwner(srcCapId);
	if (capOwners == null || capOwners.length == 0)
	{
		return;
	}
	//2. Get Owners with target CAPID.
	var targetOwners = getOwner(targetCapId);
	//3. Check to see which owner is matched in both source and target.
	for (loopk in capOwners)
	{
		sourceOwnerModel = capOwners[loopk];
		//3.1 Set target CAPID to source Owner.
		sourceOwnerModel.setCapID(targetCapId);
		targetOwnerModel = null;
		//3.2 Check to see if sourceOwner exist.
		if (targetOwners != null && targetOwners.length > 0)
		{
			for (loop2 in targetOwners)
			{
				if (isMatchOwner(sourceOwnerModel, targetOwners[loop2]))
				{
					targetOwnerModel = targetOwners[loop2];
					break;
				}
			}
		}
		//3.3 It is a matched owner model.
		if (targetOwnerModel != null)
		{
			//3.3.1 Copy information from source to target.
			aa.owner.copyCapOwnerModel(sourceOwnerModel, targetOwnerModel);
			//3.3.2 Edit owner with source owner information. 
			aa.owner.updateDailyOwnerWithAPOAttribute(targetOwnerModel);
		}
		//3.4 It is new owner model.
		else
		{
			//3.4.1 Create new Owner.
			aa.owner.createCapOwnerWithAPOAttribute(sourceOwnerModel);
		}
	}
}

function isMatchOwner(ownerScriptModel1, ownerScriptModel2)
{
	if (ownerScriptModel1 == null || ownerScriptModel2 == null)
	{
		return false;
	}
	var fullName1 = ownerScriptModel1.getOwnerFullName();
	var fullName2 = ownerScriptModel2.getOwnerFullName();
	if ((fullName1 == null && fullName2 != null) 
		|| (fullName1 != null && fullName2 == null))
	{
		return false;
	}
	if (fullName1 != null && !fullName1.equals(fullName2))
	{
		return false;
	}
	return	true;
}

function getOwner(capId)
{
	capOwnerArr = null;
	var s_result = aa.owner.getOwnerByCapId(capId);
	if(s_result.getSuccess())
	{
		capOwnerArr = s_result.getOutput();
		if (capOwnerArr == null || capOwnerArr.length == 0)
		{
			logDebug("WARNING: no Owner on this CAP:" + capId);
			capOwnerArr = null;
		}
	}
	else
	{
		logDebug("ERROR: Failed to Owner: " + s_result.getErrorMessage());
		capOwnerArr = null;	
	}
	return capOwnerArr;
}

function copyCapCondition(srcCapId, targetCapId)
{
	//1. Get Cap condition with source CAPID.
	var capConditions = getCapConditionByCapID(srcCapId);
	if (capConditions == null || capConditions.length == 0)
	{
		return;
	}
	//2. Get Cap condition with target CAPID.
	var targetCapConditions = getCapConditionByCapID(targetCapId);
	//3. Check to see which Cap condition is matched in both source and target.
	for (loopk in capConditions)
	{
		sourceCapCondition = capConditions[loopk];
		//3.1 Set target CAPID to source Cap condition.
		sourceCapCondition.setCapID(targetCapId);
		targetCapCondition = null;
		//3.2 Check to see if source Cap condition exist in target CAP. 
		if (targetCapConditions != null && targetCapConditions.length > 0)
		{
			for (loop2 in targetCapConditions)
			{
				if (isMatchCapCondition(sourceCapCondition, targetCapConditions[loop2]))
				{
					targetCapCondition = targetCapConditions[loop2];
					break;
				}
			}
		}
		//3.3 It is a matched Cap condition model.
		if (targetCapCondition != null)
		{
			//3.3.1 Copy information from source to target.
			sourceCapCondition.setConditionNumber(targetCapCondition.getConditionNumber());
			//3.3.2 Edit Cap condition with source Cap condition information. 
			aa.capCondition.editCapCondition(sourceCapCondition);
		}
		//3.4 It is new Cap condition model.
		else
		{
			//3.4.1 Create new Cap condition.
			aa.capCondition.createCapCondition(sourceCapCondition);
		}
	}
}

function isMatchCapCondition(capConditionScriptModel1, capConditionScriptModel2)
{
	if (capConditionScriptModel1 == null || capConditionScriptModel2 == null)
	{
		return false;
	}
	var description1 = capConditionScriptModel1.getConditionDescription();
	var description2 = capConditionScriptModel2.getConditionDescription();
	if ((description1 == null && description2 != null) 
		|| (description1 != null && description2 == null))
	{
		return false;
	}
	if (description1 != null && !description1.equals(description2))
	{
		return false;
	}
	var conGroup1 = capConditionScriptModel1.getConditionGroup();
	var conGroup2 = capConditionScriptModel2.getConditionGroup();
	if ((conGroup1 == null && conGroup2 != null) 
		|| (conGroup1 != null && conGroup2 == null))
	{
		return false;
	}
	if (conGroup1 != null && !conGroup1.equals(conGroup2))
	{
		return false;
	}
	return true;
}

function getCapConditionByCapID(capId)
{
	capConditionScriptModels = null;
	
	var s_result = aa.capCondition.getCapConditions(capId);
	if(s_result.getSuccess())
	{
		capConditionScriptModels = s_result.getOutput();
		if (capConditionScriptModels == null || capConditionScriptModels.length == 0)
		{
			logDebug("WARNING: no cap condition on this CAP:" + capId);
			capConditionScriptModels = null;
		}
	}
	else
	{
		logDebug("ERROR: Failed to get cap condition: " + s_result.getErrorMessage());
		capConditionScriptModels = null;	
	}
	return capConditionScriptModels;
}

function copyAdditionalInfo(srcCapId, targetCapId)
{
	//1. Get Additional Information with source CAPID.  (BValuatnScriptModel)
	var  additionalInfo = getAdditionalInfo(srcCapId);
	if (additionalInfo == null)
	{
		return;
	}
	//2. Get CAP detail with source CAPID.
	var  capDetail = getCapDetailByID(srcCapId);
	//3. Set target CAP ID to additional info.
	additionalInfo.setCapID(targetCapId);
	if (capDetail != null)
	{
		capDetail.setCapID(targetCapId);
	}
	//4. Edit or create additional infor for target CAP.
	aa.cap.editAddtInfo(capDetail, additionalInfo);
}

//Return BValuatnScriptModel for additional info.
function getAdditionalInfo(capId)
{
	bvaluatnScriptModel = null;
	var s_result = aa.cap.getBValuatn4AddtInfo(capId);
	if(s_result.getSuccess())
	{
		bvaluatnScriptModel = s_result.getOutput();
		if (bvaluatnScriptModel == null)
		{
			logDebug("WARNING: no additional info on this CAP:" + capId);
			bvaluatnScriptModel = null;
		}
	}
	else
	{
		logDebug("ERROR: Failed to get additional info: " + s_result.getErrorMessage());
		bvaluatnScriptModel = null;	
	}
	// Return bvaluatnScriptModel
	return bvaluatnScriptModel;
}

function getCapDetailByID(capId)
{
	capDetailScriptModel = null;
	var s_result = aa.cap.getCapDetail(capId);
	if(s_result.getSuccess())
	{
		capDetailScriptModel = s_result.getOutput();
		if (capDetailScriptModel == null)
		{
			logDebug("WARNING: no cap detail on this CAP:" + capId);
			capDetailScriptModel = null;
		}
	}
	else
	{
		logDebug("ERROR: Failed to get cap detail: " + s_result.getErrorMessage());
		capDetailScriptModel = null;	
	}
	// Return capDetailScriptModel
	return capDetailScriptModel;
}

function copyAppSpecificRenewal(AInfo,newCap) // copy all App Specific info into new Cap, 1 optional parameter for ignoreArr
{
	var ignoreArr = new Array();
	var limitCopy = false;
	if (arguments.length > 2) 
	{
		ignoreArr = arguments[2];
		limitCopy = true;
	}
	
	for (asi in AInfo){
		//Check list
		if(limitCopy){
			var ignore=false;
		  	for(var i = 0; i < ignoreArr.length; i++)
		  		if(ignoreArr[i] == asi){
		  			ignore=true;
					logDebug("Skipping ASI Field: " + ignoreArr[i]);
		  			break;
		  		}
		  	if(ignore)
		  		continue;
		}
		//logDebug("Copying ASI Field: " + asi);
		editAppSpecific(asi,AInfo[asi],newCap);
	}
}


function getParentLicenseForRenewal(capId)
{
	var relatedCapsResult = aa.cap.getProjectByChildCapID(capId, "Renewal", "");
	logDebug(relatedCapsResult);
	if (relatedCapsResult.getSuccess())
		{
			parentArray = relatedCapsResult.getOutput();
			
			if (parentArray.length)
			{
				var licenseCapId;
				for (project in parentArray)
				{
					logDebug(parentArray[project]);
					var curProject = parentArray[project];
					licenseCapId = curProject.getProjectID();
					return licenseCapId;
				}
			}
			else
			{
				logDebug( "**WARNING: GetParent found no parent license for this renewal");
				return false;
			}
		}
		else
		{ 
			logDebug( "**WARNING: getting parent license:  " + relatedCapsResult.getErrorMessage());
			return false;
		}
}

function editLookup(stdChoice,stdValue,stdDesc) 
	{
	//check if stdChoice and stdValue already exist; if they do, update;
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);
	if (bizDomScriptResult.getSuccess())
		{
		bds = bizDomScriptResult.getOutput();
		}
	else
		{
		logDebug("Std Choice(" + stdChoice + "," + stdValue + ") does not exist to edit, adding...");
		addLookup(stdChoice,stdValue,stdDesc);
		return false;
		}
	var bd = bds.getBizDomain()
		
	bd.setDescription(stdDesc);
	var editResult = aa.bizDomain.editBizDomain(bd)
	
	if (editResult.getSuccess())
		logDebug("Successfully edited Std Choice(" + stdChoice + "," + stdValue + ") = " + stdDesc);
	else
		logDebug("**ERROR editing Std Choice " + editResult.getErrorMessage());
	}


function copyContactsWithAddresses(sourceCapId, targetCapId) {
	
	var capPeoples = getPeopleWithAddresses(sourceCapId);
	if (capPeoples != null && capPeoples.length > 0) {
		for (loopk in capPeoples) {
			sourcePeopleModel = capPeoples[loopk];
			sourcePeopleModel.getCapContactModel().setCapID(targetCapId);
			aa.people.createCapContactWithAttribute(sourcePeopleModel.getCapContactModel());
			logDebug("added contact");
		}
	}
	else {
		logDebug("No peoples on source");
	}
}

function getPeopleWithAddresses(capId)
{
	capPeopleArr = null;
	var s_result = aa.people.getCapContactByCapID(capId);
	if(s_result.getSuccess())
	{
		capPeopleArr = s_result.getOutput();
		if(capPeopleArr != null || capPeopleArr.length > 0)
		{
			for (loopk in capPeopleArr)	
			{
				var capContactScriptModel = capPeopleArr[loopk];
				var capContactModel = capContactScriptModel.getCapContactModel();
				var peopleModel = capContactScriptModel.getPeople();
				var contactAddressrs = aa.address.getContactAddressListByCapContact(capContactModel);
				if (contactAddressrs.getSuccess())
				{
					var contactAddressModelArr = convertContactAddressModelArr(contactAddressrs.getOutput());
					peopleModel.setContactAddressList(contactAddressModelArr);    
				}
			}
		}
		
		else
		{
			capPeopleArr = null;
		}
	}
	else
	{
		logDebug("ERROR: Failed to People: " + s_result.getErrorMessage());
		capPeopleArr = null;	
	}
	return capPeopleArr;
}
function convertContactAddressModelArr(contactAddressScriptModelArr)
{
	var contactAddressModelArr = null;
	if(contactAddressScriptModelArr != null && contactAddressScriptModelArr.length > 0)
	{
		logDebug(contactAddressScriptModelArr.length + " addresses");
		contactAddressModelArr = aa.util.newArrayList();
		for(loopk in contactAddressScriptModelArr)
		{
			contactAddressModelArr.add(contactAddressScriptModelArr[loopk].getContactAddressModel());
		}
	}	
	return contactAddressModelArr;
}






function copyASITables(pFromCapId,pToCapId) {
	// Function dependencies on addASITable()
	// par3 is optional 0 based string array of table to ignore
	var itemCap = pFromCapId;

	var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	var ta = gm.getTablesArray()
	var tai = ta.iterator();
	var tableArr = new Array();
	var ignoreArr = new Array();
	var limitCopy = false;
	if (arguments.length > 2) 
	{
		ignoreArr = arguments[2];
		limitCopy = true;
	}

	while (tai.hasNext())
	  {
	  var tsm = tai.next();

	  var tempObject = new Array();
	  var tempArray = new Array();
	  var tn = tsm.getTableName() + "";
 	  var numrows = 0;
 	  
 	  //Check list
 	  if(limitCopy){
 	  	var ignore=false;
 	  	for(var i = 0; i < ignoreArr.length; i++)
 	  		if(ignoreArr[i] == tn){
 	  			ignore=true;
 	  			break;
 	  		}
 	  	if(ignore)
 	  		continue;
 	  }
	  if (!tsm.rowIndex.isEmpty())
	  	{
	  	  var tsmfldi = tsm.getTableField().iterator();
		  var tsmcoli = tsm.getColumns().iterator();
		  var readOnlyi = tsm.getAppSpecificTableModel().getReadonlyField().iterator(); // get Readonly filed
		  var numrows = 1;

		  while (tsmfldi.hasNext())  // cycle through fields
			{
			if (!tsmcoli.hasNext())  // cycle through columns
				{
				var tsmcoli = tsm.getColumns().iterator();
				tempArray.push(tempObject);    // end of record
				var tempObject = new Array();  // clear the temp obj
				numrows++;
				}
			var tcol = tsmcoli.next();
			var tval = tsmfldi.next();
			
			var readOnly = 'N';
			if (readOnlyi.hasNext()) {
				readOnly = readOnlyi.next();
				}

			var fieldInfo = new asiTableValObj(tcol.getColumnName(), tval, readOnly);
			tempObject[tcol.getColumnName()] = fieldInfo;
			//tempObject[tcol.getColumnName()] = tval;
			}

			tempArray.push(tempObject);  // end of record
		}

      	addASITable(tn,tempArray,pToCapId);
	  logDebug("ASI Table Array : " + tn + " (" + numrows + " Rows)");
	  }
	}
	
function copyAppSpecificRenewal(AInfo,newCap) // copy all App Specific info into new Cap, 1 optional parameter for ignoreArr
{
	var ignoreArr = new Array();
	var limitCopy = false;
	if (arguments.length > 2) 
	{
		ignoreArr = arguments[2];
		limitCopy = true;
	}
	
	for (asi in AInfo){
		//Check list
		if(limitCopy){
			var ignore=false;
		  	for(var i = 0; i < ignoreArr.length; i++)
		  		if(ignoreArr[i] == asi){
		  			ignore=true;
					logDebug("Skipping ASI Field: " + ignoreArr[i]);
		  			break;
		  		}
		  	if(ignore)
		  		continue;
		}
		//logDebug("Copying ASI Field: " + asi);
		editAppSpecific(asi,AInfo[asi],newCap);
	}
}
function logDebug(dstr) {
	aa.debug("APPSUBMITAFTER4RENEW" + aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr);
}


function loadAppSpecific(thisArr) {
	// 
	// Returns an associative array of App Specific Info
	// Optional second parameter, cap ID to load from
	//
	
	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

    	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess())
	 	{
		var fAppSpecInfoObj = appSpecInfoResult.getOutput();

		for (loopk in fAppSpecInfoObj)
			{
			if (useAppSpecificGroupName)
				thisArr[fAppSpecInfoObj[loopk].getCheckboxType() + "." + fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			else
				thisArr[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			}
		}
	}

 function addASITable(tableName,tableValueArray) // optional capId
    	{
  	//  tableName is the name of the ASI table
  	//  tableValueArray is an array of associative array values.  All elements MUST be either a string or asiTableVal object
    	var itemCap = capId
  	if (arguments.length > 2)
  		itemCap = arguments[2]; // use cap ID specified in args
  
  	var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName)
  
  	if (!tssmResult.getSuccess())
  		{ logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage()) ; return false }
  
  	var tssm = tssmResult.getOutput();
  	var tsm = tssm.getAppSpecificTableModel();
  	var fld = tsm.getTableField();
        var fld_readonly = tsm.getReadonlyField(); // get Readonly field
  
         	for (thisrow in tableValueArray)
  		{
  
  		var col = tsm.getColumns()
  		var coli = col.iterator();
  
  		while (coli.hasNext())
  			{
  			var colname = coli.next();
  
			if (typeof(tableValueArray[thisrow][colname.getColumnName()]) == "object")  // we are passed an asiTablVal Obj
				{
	  			fld.add(tableValueArray[thisrow][colname.getColumnName()].fieldValue);
	  			fld_readonly.add(tableValueArray[thisrow][colname.getColumnName()].readOnly);
				}
			else // we are passed a string
				{
  				fld.add(tableValueArray[thisrow][colname.getColumnName()]);
  				fld_readonly.add(null);
				}
  			}
  
  		tsm.setTableField(fld);
  
  		tsm.setReadonlyField(fld_readonly);
  
  		}
  
  	var addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);
  
  	 if (!addResult .getSuccess())
  		{ logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()) ; return false }
  	else
  		logDebug("Successfully added record to ASI Table: " + tableName);
  
  	}
 
 function editAppSpecific(itemName,itemValue)  // optional: itemCap
 {
 	var itemCap = capId;
 	var itemGroup = null;
 	if (arguments.length == 3) itemCap = arguments[2]; // use cap ID specified in args
    	
   	if (useAppSpecificGroupName)
 	{
 		if (itemName.indexOf(".") < 0)
 			{ logDebug("**WARNING: editAppSpecific requires group name prefix when useAppSpecificGroupName is true") ; return false }
 		
 		
 		itemGroup = itemName.substr(0,itemName.indexOf("."));
 		itemName = itemName.substr(itemName.indexOf(".")+1);
 	}
    	
    	var appSpecInfoResult = aa.appSpecificInfo.editSingleAppSpecific(itemCap,itemName,itemValue,itemGroup);

 	
 }

 function copyLicensedProf(sCapId, tCapId)
 {
 	//Function will copy all licensed professionals from source CapID to target CapID

 	var licProf = aa.licenseProfessional.getLicensedProfessionalsByCapID(sCapId).getOutput();
 	if (licProf != null)
 		for(x in licProf)
 		{
 			licProf[x].setCapID(tCapId);
 			aa.licenseProfessional.createLicensedProfessional(licProf[x]);
 			logDebug("Copied " + licProf[x].getLicenseNbr());
 		}
 	else
 		logDebug("No licensed professional on source");
 }

 function editAppName(newname)
	{
	// 4/30/08 - DQ - Corrected Error where option parameter was ignored
	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

	capResult = aa.cap.getCap(itemCap)

	if (!capResult.getSuccess())
		{logDebug("**WARNING: error getting cap : " + capResult.getErrorMessage()) ; return false }

	capModel = capResult.getOutput().getCapModel()

	capModel.setSpecialText(newname)

	setNameResult = aa.cap.editCapByPK(capModel)

	if (!setNameResult.getSuccess())
		{ logDebug("**WARNING: error setting cap name : " + setNameResult.getErrorMessage()) ; return false }


	return true;
	}


function asiTableValObj(columnName, fieldValue, readOnly) {
	this.columnName = columnName;
	this.fieldValue = fieldValue;
	this.readOnly = readOnly;
	this.hasValue = Boolean(fieldValue != null & fieldValue != "");

	asiTableValObj.prototype.toString=function(){ return this.hasValue ? String(this.fieldValue) : String(""); }
}; 
 

function placeConditionOnRelatedNotCompleteRenewals(parentCap) {
logDebug("START placeConditionOnRelatedNotCompleteRenewals (PCORNCR) ");
	var allMyChildrens = getChildren('Licenses/Cannabis/*/License',parentCap);

	for (chi in allMyChildrens) {
		thisAppIdArr = allMyChildrens[chi].toString().split('-');
		thiscap = aa.cap.getCapID(thisAppIdArr[0],thisAppIdArr[1],thisAppIdArr[2]).getOutput();
		var capResult = aa.cap.getCap(thiscap);

		if (!capResult.getSuccess()) {
			logDebug("PCORNCR:" + thiscap.getCustomID() + ": Record is deactivated, skipping");
			continue;
		} 
		else {
			var cap = capResult.getOutput();
			var capStatus = cap.getCapStatus();
			
			if (capStatus == 'About to Expire') {
				logDebug("PCORNCR:" + thiscap.getCustomID() + ": Record IS ABOUT TO EXPIRE!");
				var thisProjectList = aa.cap.getProjectByMasterID(thiscap, "Renewal","").getOutput();
				
				logDebug("PCORNCR:" + "there are "+thisProjectList.length +" records in the project list");
				
				for (pj in thisProjectList) {
					logDebug("PCORNCR:" + "finding renewals and printing renewal..."+pj);
					if ( thisProjectList[pj].getStatus() != "Complete" ) {
						var thisRenProjCap = thisProjectList[pj].getCapID();
						logDebug("PCORNCR:" + "the renewal record id is:"+thisRenProjCap);
						
						var thisRenewalAppIdArr = thisRenProjCap.toString().split('-');
						var thisRenCap = aa.cap.getCapID(thisRenewalAppIdArr[0],thisRenewalAppIdArr[1],thisRenewalAppIdArr[2]).getOutput();
						var capRenResult = aa.cap.getCap(thisRenCap);

						if (!capRenResult.getSuccess()) {
							logDebug("PCORNCR:" + thisRenCap.getCustomID() + ": Renewal Record is deactivated, no need to place condition");
							continue;
						} 
						else {
							var renCap = capRenResult.getOutput();

							// place a hold condition on this renewal
							var conditionGroup = "Licensing",
								conditionType = "Cannabis Licensing",
								conditionName = "Parent License Renewal Incomplete",
								conditionComment = "Renewal of Parent License must be complete before this renewal can be completed.",
								impactCode = "Notice",
								condStatus = "Applied",
								auditStatus = "A",
								displayNotice = "Y",
								displayNoticeOnACA = "Y",
								condInheretible = "N",
								displayLongDesc = "Y";


							//Create new empty cap condition model and set the expected values.
							var newCondModel = aa.capCondition.getNewConditionScriptModel().getOutput();

							newCondModel.setCapID(thisRenCap);
							newCondModel.setConditionGroup(conditionGroup);
							newCondModel.setConditionType(conditionType);
							newCondModel.setConditionDescription(conditionName);
							newCondModel.setConditionComment(conditionComment);
							newCondModel.setLongDescripton(conditionComment);
							newCondModel.setDispConditionComment(conditionComment);
							newCondModel.setDispLongDescripton(displayLongDesc);
							newCondModel.setConditionStatus(condStatus);
							newCondModel.setEffectDate(sysDate);
							newCondModel.setIssuedDate(sysDate);
							newCondModel.setStatusDate(sysDate);
							newCondModel.setIssuedByUser(systemUserObj);
							newCondModel.setStatusByUser(systemUserObj);
							newCondModel.setAuditID(currentUserID);
							newCondModel.setAuditStatus(auditStatus);
							newCondModel.setDisplayConditionNotice(displayNotice);
							newCondModel.setDisplayNoticeOnACA(displayNoticeOnACA);
							newCondModel.setImpactCode(impactCode);
							newCondModel.setInheritable(condInheretible);

							aa.capCondition.createCapCondition(newCondModel);
							logDebug("PCORNCR:" + "Condition created!");
						}
					} else { logDebug("PCORNCR:" + "this is a completed renewal, skipping!"); }
				}
			}
			else {
				logDebug("PCORNCR:" + thiscap.getCustomID() + ": Record is NOT about to expire, skipping");
			}
		}
	}
	logDebug("END placeConditionOnRelatedNotCompleteRenewals");
}

 
