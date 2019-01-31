/*------------------------------------------------------------------------------------------------------/
| SVN $Id: WorkflowTaskUpdateAfter.js 6534 2012-03-23 23:32:09Z dane.quatacker $
| Program : WorkflowTaskUpdateAfterV2.0.js
| Event   : WorkflowTaskUpdateAfter
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : N/A
| Action# : N/A
|
| Notes   :
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

var controlString = "WorkflowTaskUpdateAfter"; 				// Standard choice for control
var preExecute = "PreExecuteForAfterEvents";				// Standard choice to execute first (for globals, etc)
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
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
	return emseScript.getScriptText() + "";	
}

/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/
var wfTask = aa.env.getValue("WorkflowTask");				// Workflow Task Triggered event
var wfStatus = aa.env.getValue("WorkflowStatus");			// Status of workflow that triggered event
var wfDate = aa.env.getValue("WorkflowStatusDate");			// date of status of workflow that triggered event
var wfDateMMDDYYYY = wfDate.substr(5,2) + "/" + wfDate.substr(8,2) + "/" + wfDate.substr(0,4);	// date of status of workflow that triggered event in format MM/DD/YYYY
var wfProcessID = aa.env.getValue("ProcessID");				// Process ID of workflow
var wfStep ; var wfComment ; var wfNote ; var wfDue ;			// Initialize
var wfProcess ; 							// Initialize
// Go get other task details
var wfObj = aa.workflow.getTasks(capId).getOutput();
for (i in wfObj)
	{
	fTask = wfObj[i];
	if (fTask.getTaskDescription().equals(wfTask) && (fTask.getProcessID() == wfProcessID))
		{
		wfStep = fTask.getStepNumber();
		wfProcess = fTask.getProcessCode();
		wfComment = fTask.getDispositionComment();
		wfNote = fTask.getDispositionNote();
		wfDue = fTask.getDueDate();
		wfHours = fTask.getHoursSpent();
		wfTaskObj = fTask;
		}
	}
logDebug("wfTask = " + wfTask);
logDebug("wfTaskObj = " + wfTask.getClass());
logDebug("wfStatus = " + wfStatus);
logDebug("wfDate = " + wfDate);
logDebug("wfDateMMDDYYYY = " + wfDateMMDDYYYY);
logDebug("wfStep = " + wfStep);
logDebug("wfComment = " + wfComment);
logDebug("wfProcess = " + wfProcess);
logDebug("wfNote = " + wfNote);

/* Added for version 2.0 */
var wfStaffUserID = aa.env.getValue("StaffUserID");
var timeAccountingArray = new Array()
if(aa.env.getValue("TimeAccountingArray") != "")
	timeAccountingArray =  aa.env.getValue("TimeAccountingArray");
var wfTimeBillable = aa.env.getValue("Billable");
var wfTimeOT = aa.env.getValue("Overtime");
logDebug("wfStaffUserID = " + wfStaffUserID);
logDebug("wfTimeBillable = " + wfTimeBillable);
logDebug("wfTimeOT = " + wfTimeOT);
logDebug("wfHours = " + wfHours);

if (timeAccountingArray != null || timeAccountingArray !='')
	{
			for(var i=0;i<timeAccountingArray.length;i++)
			{
			var timeLogModel = timeAccountingArray[i];
			var timeLogSeq = timeLogModel.getTimeLogSeq();
			var dateLogged = timeLogModel.getDateLogged();
			var startTime = timeLogModel.getStartTime();
			var endTime	= timeLogModel.getEndTime();
			var timeElapsedHours = timeLogModel.getTimeElapsed().getHours();
			var timeElapsedMin = timeLogModel.getTimeElapsed().getMinutes();

			logDebug("TAtimeLogSeq = " + timeLogSeq);
			logDebug("TAdateLogged = " + dateLogged);
			logDebug("TAstartTime = " + startTime);
			logDebug("TAendTime = " + endTime);
			logDebug("TAtimeElapsedHours = " + timeElapsedHours);
			logDebug("TAtimeElapsedMin = " + timeElapsedMin);
			}
	}

/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

doStandardChoiceActions(controlString,true,0);

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

