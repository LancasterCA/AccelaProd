/*------------------------------------------------------------------------------------------------------/
|
| Program : PaymentRefundAfterHandler.js
| Event   : PaymentRefundAfter
|
| Usage   : Custom Script by Woolpert (Based on Accela's PaymentApplyAfter.js)
|
| Client  : N/A
| Action# : N/A
|
| Notes   :
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/

var controlString = "PaymentRefundAfter";       // Standard choice for control
var preExecute = "PreExecuteForAfterEvents"		// Standard choice to execute first (for globals, etc)
var documentOnly = false;						// Document Only -- displays hierarchy of std choice steps

/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var SCRIPT_VERSION = 3.0

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
| BEGIN Event Specific Variable
/------------------------------------------------------------------------------------------------------*/

var capid = aa.env.getValue('CapIdModel');
logDebug("capid: " + getObject(capid));
logDebug("capid.getCustomID(): " + getObject(capid).getCustomID());

var comment = aa.env.getValue('Comment');
logDebug("comment: " + getObject(comment));

var feeItemInvoiceModelArray = aa.env.getValue('FeeItemInvoiceModelArray');
logDebug("feeItemInvoiceModelArray.length: " + getObject(feeItemInvoiceModelArray).length);
logDebug("feeItemInvoiceModelArray.length(): " + feeItemInvoiceModelArray.length());

var feeSeqArr = aa.env.getValue('FeeSeqNbrArray');
logDebug("feeSeqArr.length: " + getObject(feeSeqArr).length);

var paymentAmountArray = aa.env.getValue('PaymentAmountArray');
logDebug("paymentAmountArray.length: " + getObject(paymentAmountArray.length));

var paymentModel = aa.env.getValue('PaymentModel');
logDebug("paymentModel: " + getObject(paymentModel));

var reason = aa.env.getValue('Reason');
logDebug("reason: " + getObject(reason));

var totalAmount = aa.env.getValue('TotalAmount');
logDebug("totalAmount: " + getObject(totalAmount));

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
	
function getObject(obj)
{
	if (obj) return obj;
	return "";
}
/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/

