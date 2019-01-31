/*------------------------------------------------------------------------------------------------------/
| Program: Batch Expiration.js  Trigger: Batch
| Client:
|
| Version 1.0 - Base Version. 11/01/08 JHS
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
|
| START: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
emailText = "";
maxSeconds = 4.5 * 60;		// number of seconds allowed for batch processing, usually < 5*60
message = "";
br = "<br>";
/*------------------------------------------------------------------------------------------------------/
| BEGIN Includes
/------------------------------------------------------------------------------------------------------*/
SCRIPT_VERSION = 2.0

eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_BATCH"));
eval(getScriptText("INCLUDES_CUSTOM"));


function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
	return emseScript.getScriptText() + "";
}

/*------------------------------------------------------------------------------------------------------/
|
| END: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
showDebug = aa.env.getValue("showDebug").substring(0,1).toUpperCase().equals("Y");

sysDate = aa.date.getCurrentDate();
batchJobResult = aa.batchJob.getJobID()
batchJobName = "" + aa.env.getValue("BatchJobName");
wfObjArray = null;


batchJobID = 0;
if (batchJobResult.getSuccess())
  {
  batchJobID = batchJobResult.getOutput();
  logDebug("Batch Job " + batchJobName + " Job ID is " + batchJobID);
  }
else
  logDebug("Batch job ID not found " + batchJobResult.getErrorMessage());


/*----------------------------------------------------------------------------------------------------/
|
| Start: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var fromDate = getParam("fromDate");							// Hardcoded dates.   Use for testing only
var toDate = getParam("toDate");								// ""
var dFromDate = aa.date.parseDate(fromDate);					//
var dToDate = aa.date.parseDate(toDate);						//
var lookAheadDays = aa.env.getValue("lookAheadDays");   		// Number of days from today
var daySpan = aa.env.getValue("daySpan");						// Days to search (6 if run weekly, 0 if daily, etc.)
var appGroup = getParam("appGroup");							//   app Group to process {Licenses}
var appTypeType = getParam("appTypeType");						//   app type to process {Rental License}
var appSubtype = getParam("appSubtype");						//   app subtype to process {NA}
var appCategory = getParam("appCategory");						//   app category to process {NA}
var expStatus = getParam("expirationStatus")					//   test for this expiration status
var newExpStatus = getParam("newExpirationStatus")				//   update to this expiration status
var newAppStatus = getParam("newApplicationStatus")				//   update the CAP to this status
var gracePeriodDays = getParam("gracePeriodDays")				//	bump up expiration date by this many days
var setPrefix = getParam("setPrefix");							//   Prefix for set ID
var inspSched = getParam("inspSched");							//   Schedule Inspection
var skipAppStatusArray = getParam("skipAppStatus").split(",");	//   Skip records with one of these application statuses
var emailAddress = getParam("emailAddress");					// email to send report
var sendEmailToContactTypes = getParam("sendEmailToContactTypes");// send out emails?
var emailTemplate = getParam("emailTemplate");					// email Template
var deactivateLicense = getParam("deactivateLicense");			// deactivate the LP
var lockParentLicense = getParam("lockParentLicense");     		// add this lock on the parent license
var createRenewalRecord = getParam("createTempRenewalRecord");	// create a temporary record
var feeSched = getParam("feeSched"); 							//
var feeList = getParam("feeList");								// comma delimted list of fees to add
var feePeriod = getParam("feePeriod");							// fee period to use {LICENSE}
/*----------------------------------------------------------------------------------------------------/
|
| End: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var timeExpired = false;

if (!fromDate.length) // no "from" date, assume today + number of days to look ahead
	fromDate = dateAdd(null,parseInt(lookAheadDays))

if (!toDate.length)  // no "to" date, assume today + number of look ahead days + span
	toDate = dateAdd(null,parseInt(lookAheadDays)+parseInt(daySpan))

var mailFrom = lookup("ACA_EMAIL_TO_AND_FROM_SETTING","RENEW_LICENSE_AUTO_ISSUANCE_MAILFROM");
var acaSite = lookup("ACA_CONFIGS","ACA_SITE");
acaSite = acaSite.substr(0,acaSite.toUpperCase().indexOf("/ADMIN"));

logDebug("Date Range -- fromDate: " + fromDate + ", toDate: " + toDate)



var startTime = startDate.getTime();			// Start timer
var systemUserObj = aa.person.getUser("ADMIN").getOutput();

if (appGroup=="")
	appGroup="*";
if (appTypeType=="")
	appTypeType="*";
if (appSubtype=="")
	appSubtype="*";
if (appCategory=="")
	appCategory="*";
var appType = appGroup+"/"+appTypeType+"/"+appSubtype+"/"+appCategory;

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

logDebug("Start of Job");

if (!timeExpired) mainProcess();

logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");

if (emailAddress.length)
	aa.sendMail("noreply@accela.com", emailAddress, "", batchJobName + " Results", emailText);


/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/


function mainProcess()
	{
	var capFilterType = 0
	var capFilterInactive = 0;
	var capFilterError = 0;
	var capFilterStatus = 0;
	var capDeactivated = 0;
	var capCount = 0;
	var inspDate;
	var setName;
	var setDescription;

	var expResult = aa.expiration.getLicensesByDate(expStatus,fromDate,toDate);

	if (expResult.getSuccess())
		{
		myExp = expResult.getOutput();
		logDebug("Processing " + myExp.length + " expiration records");
		}
	else
		{ logDebug("ERROR: Getting Expirations, reason is: " + expResult.getErrorType() + ":" + expResult.getErrorMessage()) ; return false }

	for (thisExp in myExp)  // for each b1expiration (effectively, each license app)
		{
		if (elapsed() > maxSeconds) // only continue if time hasn't expired
			{
			logDebug("A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.") ;
			timeExpired = true ;
			break;
			}

		b1Exp = myExp[thisExp];
		var	expDate = b1Exp.getExpDate();
		if (expDate) var b1ExpDate = expDate.getMonth() + "/" + expDate.getDayOfMonth() + "/" + expDate.getYear();
		var b1Status = b1Exp.getExpStatus();
		var renewalCapId = null;

		capId = aa.cap.getCapID(b1Exp.getCapID().getID1(),b1Exp.getCapID().getID2(),b1Exp.getCapID().getID3()).getOutput();

		if (!capId)
			{
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
			}
		else	{
			var cap = capResult.getOutput();
			}

		var capStatus = cap.getCapStatus();

		appTypeResult = cap.getCapType();		//create CapTypeModel object
		appTypeString = appTypeResult.toString();
		appTypeArray = appTypeString.split("/");

		// Filter by CAP Type
		if (appType.length && !appMatch(appType))
			{
			capFilterType++;
			logDebug(altId + ": Application Type does not match")
			continue;
			}

		// Filter by CAP Status
		if (exists(capStatus,skipAppStatusArray))
			{
			capFilterStatus++;
			logDebug(altId + ": skipping due to application status of " + capStatus)
			continue;
			}

		capCount++;


		// Create Set
		if (setPrefix != "" && capCount == 1)
			{
			var yy = startDate.getFullYear().toString().substr(2,2);
			var mm = (startDate.getMonth()+1).toString();
			if (mm.length<2)
				mm = "0"+mm;
			var dd = startDate.getDate().toString();
			if (dd.length<2)
				dd = "0"+dd;
			var hh = startDate.getHours().toString();
			if (hh.length<2)
				hh = "0"+hh;
			var mi = startDate.getMinutes().toString();
			if (mi.length<2)
				mi = "0"+mi;

			var setName = setPrefix.substr(0,5) + yy + mm + dd + hh + mi;

			setDescription = setPrefix + " : " + startDate.toLocaleString()
			var setCreateResult= aa.set.createSet(setName,setDescription)

			if (setCreateResult.getSuccess())
				logDebug("Set ID "+setName+" created for CAPs processed by this batch job.");
			else
				logDebug("ERROR: Unable to create new Set ID "+setName+" created for CAPs processed by this batch job.");

			}


		// Actions start here:

		var refLic = getRefLicenseProf(altId) // Load the reference License Professional

		if (refLic && deactivateLicense.substring(0,1).toUpperCase().equals("Y"))
			{
			refLic.setAuditStatus("I");
			aa.licenseScript.editRefLicenseProf(refLic);
			logDebug(altId + ": deactivated linked License");
			}

		// update expiration status


		if (newExpStatus.length > 0)
			{
			b1Exp.setExpStatus(newExpStatus);
			aa.expiration.editB1Expiration(b1Exp.getB1Expiration());
			logDebug(altId + ": Update expiration status: " + newExpStatus);
			}

		// update expiration date based on interval

		if (parseInt(gracePeriodDays) != 0)
			{
			newExpDate = dateAdd(b1ExpDate,parseInt(gracePeriodDays));
			b1Exp.setExpDate(aa.date.parseDate(newExpDate));
			aa.expiration.editB1Expiration(b1Exp.getB1Expiration());

			logDebug(altId + ": updated CAP expiration to " + newExpDate);
			if (refLic)
				{
				refLic.setLicenseExpirationDate(aa.date.parseDate(newExpDate));
				aa.licenseScript.editRefLicenseProf(refLic);
				logDebug(altId + ": updated License expiration to " + newExpDate);
				}
			}




		if (sendEmailToContactTypes.length > 0 && emailTemplate.length > 0) {

			var conTypeArray = sendEmailToContactTypes.split(",");
			var	conArray = getContactArray(capId);

			logDebug("Have the contactArray");

			for (thisCon in conArray)
				{
				conEmail = null;
				b3Contact = conArray[thisCon];
				if (exists(b3Contact["contactType"],conTypeArray))
					conEmail = b3Contact["email"];

				if (conEmail) {
					emailParameters = aa.util.newHashtable();
					addParameter(emailParameters,"$$altid$$",altId);
					addParameter(emailParameters,"$$acaUrl$$",acaSite + getACAUrl());
					addParameter(emailParameters,"$$businessName$$",cap.getSpecialText());
					addParameter(emailParameters,"$$expirationDate$$",b1ExpDate);

					var capId4Email = aa.cap.createCapIDScriptModel(capId.getID1(),capId.getID2(),capId.getID3());

					var fileNames = [];

					aa.document.sendEmailAndSaveAsDocument(mailFrom,conEmail,"" , emailTemplate, emailParameters, capId4Email, fileNames);
					logDebug(altId + ": Sent Email template " + emailTemplate + " to " + b3Contact["contactType"] + " : " + conEmail);
					}
			}
		}

		// update CAP status

		if (newAppStatus.length > 0)
			{
			updateAppStatus(newAppStatus,"");
			logDebug(altId + ": Updated Application Status to " + newAppStatus);
		}

		// schedule Inspection

		if (inspSched.length > 0)
			{
			scheduleInspection(inspSched,"1");
			inspId = getScheduledInspId(inspSched);
			if (inspId) autoAssignInspection(inspId);
			logDebug(altId + ": Scheduled " + inspSched + ", Inspection ID: " + inspId);
			}

		// Add to Set

		if (setPrefix != "") aa.set.add(setName,capId)

		// lock Parent License

		if (lockParentLicense != "")
			{
			licCap = getLicenseCapId("*/*/*/*");

			if (licCap)
				{
					logDebug(licCap + ": adding Lock : " + lockParentLicense);
					addStdCondition("Suspension",lockParentLicense,licCap);
				}
			else
				logDebug(altId + ": Can't add Lock, no parent license found");
			}
			
		// create renewal record and add fees
		
		if (createRenewalRecord && createRenewalRecord.substring(0,1).toUpperCase().equals("Y")) {
			createResult = aa.cap.createRenewalRecord(capId)
			
			if (!createResult.getSuccess) 
				{ logDebug("Could not create renewal record : " + createResult.getErrorMessage()); }
			else {
				renewalCapId = createResult.getOutput();
				
				renewalCap = aa.cap.getCap(renewalCapId).getOutput();
				if (renewalCap.isCompleteCap())	{
					logDebug(altId + ": Renewal Record already exists : " + renewalCapId.getCustomID());
					}
				else {          
					logDebug(altId + ": created Renewal Record " + renewalCapId.getCustomID());
					
					// add fees 
					
					if (feeList.length > 0) {
							for (var fe in feeList.split(","))
								var feObj = addFee(feeList.split(",")[fe],feeSched,feePeriod,1,"Y",renewalCapId);
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


