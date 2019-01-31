/******* Testing *******
aa.env.setValue("appGroup","Permits");
aa.env.setValue("appStatus","Issued")
*/

/*------------------------------------------------------------------------------------------------------/
| Program: Batch Expiration.js  Trigger: Batch
| Client: Lancaster
|
| Frequency: Nightly
|
| Desc: This batch script runs daily to update the record status of any Permits with the status of "Issued" 
|		that have an ASI "Permit Expiration Date" of today (or older).
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
showDebug = true;
if (String(aa.env.getValue("showDebug")).length > 0) {
	showDebug = aa.env.getValue("showDebug").substring(0, 1).toUpperCase().equals("Y");
}  //aa.env.getValue("showDebug").substring(0,1).toUpperCase().equals("Y");
sysDate = aa.date.getCurrentDate();
batchJobResult = aa.batchJob.getJobID();
batchJobName = "" + aa.env.getValue("BatchJobName");

batchJobID = 0;
if (batchJobResult.getSuccess()) {
	batchJobID = batchJobResult.getOutput();
	logDebug("Batch Job " + batchJobName + " Job ID is " + batchJobID);
}
else
	logDebug("Batch job ID not found " + batchJobResult.getErrorMessage());

/*------------------------------------------------------------------------------------------------------/
|
| Start: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/

var appGroup = getParam("appGroup");							//   app Group to process {Permits}
var appTypeType = getParam("appTypeType");						//   app type to process {NA}
var appSubtype = getParam("appSubtype");						//   app subtype to process {NA}
var appCategory = getParam("appCategory");						//   app category to process {NA}
var appStatus = getParam("appStatus");
var emailAddress = getParam("emailAddress");					// email to send report
var sendEmailToContactTypes = getParam("sendEmailToContactTypes");// send out emails?
var emailTemplate = getParam("emailTemplate");					// email Template

/*------------------------------------------------------------------------------------------------------/
|
| End: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var timeExpired = false;

var startTime = startDate.getTime();			// Start timer
var systemUserObj = aa.person.getUser("ADMIN").getOutput();

if (appGroup=="")	appGroup="*";
if (appTypeType=="")	appTypeType="*";
if (appSubtype=="")	appSubtype="*";
if (appCategory=="")	appCategory="*";
var appType = appGroup+"/"+appTypeType+"/"+appSubtype+"/"+appCategory;

/*-----------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

logDebug("Start of Job");

if (!timeExpired) mainProcess();

logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");

if (emailAddress.length)
	aa.sendMail("noreply@accela.com", emailAddress, "", batchJobName + " Results", emailText);

/*-----------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

function mainProcess() {
	var expCount = 0
	var today = new Date();
	today.setHours(0); today.setMinutes(0); today.setSeconds(0); today.setMilliseconds(0)
	
	var capModelResult = aa.cap.getCapModel();
	if (capModelResult.getSuccess()) {
		var capModel = capModelResult.getOutput();
		capModel.setCapStatus(appStatus);
		var capTypeModel = capModel.getCapType();
		if (appGroup != "*") capTypeModel.setGroup(appGroup);
		if (appTypeType != "*") capTypeModel.setType(appTypeType);
		if (appSubtype != "*") capTypeModel.setSubType(appSubtype);
		if (appCategory != "*") capTypeModel.setCategory(appCategory);
		capModel.setCapType(capTypeModel);
		capResult = aa.cap.getCapIDListByCapModel(capModel);
	}
	if (capResult.getSuccess()) {
		recList = capResult.getOutput();
		logDebug("Processing " + recList.length + " Permit(s)")
	}
	else { 
		logDebug("ERROR: Getting records, reason is: " + capResult.getErrorMessage()) ;
		return false
	} 

	for (i in recList)  {
		if (elapsed() > maxSeconds) {
			// only continue if time hasn't expired
			logDebug("A script time-out has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.") ;
			timeExpired = true ;
			break;
		}
		thisRec =recList[i]
		capId = thisRec.getCapID();
		altId = null;
		tmpCap = aa.cap.getCap(capId)
		if(tmpCap.getSuccess())altId = tmpCap.getOutput().getCapModel().getAltID()
		
		ASIobj = aa.appSpecificInfo.getByCapID(capId)
		if (ASIobj.getSuccess()) {
			allASI = ASIobj.getOutput()
			expDateASI = null
			for (j in allASI) {
				switch (""+allASI[j].getCheckboxDesc()) {
				case "Permit Expiration Date":
					expDateASI = ""+allASI[j].getChecklistComment()
					break;
				}
				if ( expDateASI != null ) break;
			}
			if ( expDateASI == "" ) continue;
			logDebug(altId + ": " + expDateASI)
			expDate = new Date(expDateASI)
			if (((expDate < today) - (expDate > today)) >= 0 ) {
				aa.cap.updateAppStatus(capId, "APPLICATION", "Expired", sysDate, "Expired", systemUserObj)
				closeTask("Inspection","Expired","Set by Script","Set by Script")				
				expCount++
			}
		}
		else logDebug("Could not retrieve ASI for " + altId)
	}
	if (!timeExpired) logDebug("Expired " + expCount + " record(s).")
}