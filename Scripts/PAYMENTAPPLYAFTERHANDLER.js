/*------------------------------------------------------------------------------------------------------/
|
| Program : PaymentApplyAfterHandler.js
| Event   : PaymentApplyAfter
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

var controlString = "PaymentApplyAfter";	 	// Standard choice for control
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

var appliedAmountArr = aa.env.getValue('AppliedAmountArry');
logDebug("AppliedAmountArry: " + getObject(appliedAmountArr).length);

var capid = aa.env.getValue('CapIdModel');
logDebug("CapIdModel: " + getObject(capid));
//logDebug("getObject(capid).getCustomID():" + getObject(capid).getCustomID());

var feeSeqArr = aa.env.getValue('FeeSeqNbrArray');
logDebug("FeeSeqNbrArray: " + getObject(feeSeqArr).length);

var invoiceSeqArr = aa.env.getValue('InvoiceNbrArray');
logDebug("InvoiceNbrArray: " + getObject(invoiceSeqArr).length);

var paySeq = aa.env.getValue('PaymentNbr');
logDebug("PaymentNbr: " + getObject(paySeq));

var totalAppliedAmount = aa.env.getValue('TotalAppliedAmount');
logDebug("TotalAppliedAmount: " + getObject(totalAppliedAmount));

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
var i = 0;
for (; invoiceSeqArr && i < invoiceSeqArr.length; i ++ )
{
	logDebug("invoice sequence number" + (i+1) + " = " + invoiceSeqArr[i]);	
}
for (i = 0; feeSeqArr && i < feeSeqArr.length; i ++ )
{
	logDebug("fee sequence number" + (i+1) + " = " + feeSeqArr[i]);	
}
for (i = 0; appliedAmountArr && i < appliedAmountArr.length; i ++ )
{
	logDebug("applied amount" + (i+1) + " = " + appliedAmountArr[i]);
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
	
function getObject(obj)
{
	if (obj) return obj;
	return "";
}
/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/

