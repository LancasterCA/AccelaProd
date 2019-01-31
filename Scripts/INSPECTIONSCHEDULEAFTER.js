/*------------------------------------------------------------------------------------------------------/
| Accela Automation
| Accela, Inc.
| Copyright (C): 2012
|
| SVN Id: InspectionScheduleAfter.js 6515 2012-03-16 18:15:38Z john.schomp 
| Program : InspectionScheduleAfterV2.0.js
| Event   : InspectionScheduleAfter
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : N/A
| Action# : N/A
|
| Notes   : REQUIRES the InspectionIdList event parameter.  Executes once for each scheduled inspection.
|
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/

var controlString = "InspectionScheduleAfter"; 				// Standard choice for control
var preExecute = "PreExecuteForAfterEvents"				// Standard choice to execute first (for globals, etc)
var documentOnly = false;						// Document Only -- displays hierarchy of std choice steps

/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var SCRIPT_VERSION = 2.0

eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));

if (documentOnly) {
	doStandardChoiceActions(controlString,false,0);
	aa.env.setValue("ScriptReturnCode", "0");
	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");
	aa.abortScript();
	}
	
function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(),vScriptName);
	return emseScript.getScriptText() + "";	
}

/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/
var InspectionDate = aa.env.getValue("InspectionDate");		logDebug("InspectionDate = " + InspectionDate  );
var InspectionMode = aa.env.getValue("InspectionMode");		logDebug("InspectionMode = " +  InspectionMode  );
var InspectionTime = aa.env.getValue("InspectionTime");		logDebug("InspectionTime = " + InspectionTime  );
var InspectionType = aa.env.getValue("InspectionType");		logDebug("InspectionType = " + InspectionType);
var InspectionTypeList = aa.env.getValue("InspectionTypeList");	logDebug("InspectionTypeList = " + InspectionTypeList   );
var InspectionIdList = aa.env.getValue("InspectionIdList");	logDebug("InspectionIdList = " + InspectionIdList   );
var InspectorFirstName = aa.env.getValue("InspectorFirstName");	logDebug("InspectorFirstName = " + InspectorFirstName   );
var InspectorLastName = aa.env.getValue("InspectorLastName");	logDebug("InspectorLastName = " +  InspectorLastName  );
var InspectorMiddleName = aa.env.getValue("InspectorMiddleName");logDebug("InspectorMiddleName = " + InspectorMiddleName  );
var NumberOfInspections = aa.env.getValue("NumberOfInspections");logDebug("NumberOfInspections = " +   NumberOfInspections );
var inspTypeArr = String(InspectionTypeList).split("|");   		// Submitted Inspection Type Array
var inspIdArr = String(InspectionIdList).split("|");			// Inspection identifier Array

// Main Loop is affected by number of inspections, see below

if (inspIdArr.length == 0) logDebug("WARNING: Inspection ID List is zero length.  No actions will be performed.  To rectify, the system administrator must add the InspectionIdList parameter to this event");

/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/
for (inspCount in inspIdArr)
	{
	inspId = inspIdArr[inspCount];
	inspType = inspTypeArr[inspCount];
	inspObj = aa.inspection.getInspection(capId,inspId).getOutput();  // current inspection object
	inspGroup = inspObj.getInspection().getInspectionGroup();
	//inspSchedDate = inspObj.getScheduledDate().getMonth() + "/" + inspObj.getScheduledDate().getDayOfMonth() + "/" + inspObj.getScheduledDate().getYear();
	logDebug("Inspection #" + inspCount);
	logDebug("inspType = " + inspType);
	logDebug("inspObj = " + inspObj.getClass());
	logDebug("inspId =  " + inspIdArr[inspCount]);
	logDebug("inspGroup = " + inspGroup);
	//logDebug("inspSchedDate = " + inspSchedDate);
	doStandardChoiceActions(controlString,true,0);
	}

//
// Check for invoicing of fees
//
if (feeSeqList.length)
	{
	invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
	if (invoiceResult.getSuccess())
		logMessage("Invoicing assessed fee items is successful.");
	else
		logMessage("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
	}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0)
	{
	aa.env.setValue("ScriptReturnCode", "1");
	aa.env.setValue("ScriptReturnMessage", debug);
	}
else
	{
	aa.env.setValue("ScriptReturnCode", "0");
	if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
	if (showDebug) 	aa.env.setValue("ScriptReturnMessage", debug);
	}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/