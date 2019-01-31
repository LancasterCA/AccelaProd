/*------------------------------------------------------------------------------------------------------/
| SVN $Id: InspectionMultipleScheduleBeforeV2.0.js 1051 2007-12-18 17:58:36Z john.schomp $
| Program : InspectionMultipleScheduleBeforeV2.0.js
| Event   : InspectionMultipleScheduleBefore
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
																			  
																								   
																					

var controlString = "InspectionScheduleBefore"; 	// Standard choice for control
var preExecute = "PreExecuteForBeforeEvents"		// Standard choice to execute first (for globals, etc)
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

//
// load up an array of result objects
//

schedObjArray = new Array();

var s_id1 = aa.env.getValue("PermitID1Array");
var s_id2 = aa.env.getValue("PermitID2Array");
var s_id3 = aa.env.getValue("PermitID3Array");
var inspIdArr = aa.env.getValue("InspectionIDArray");
var inspInspArr = aa.env.getValue("InspectionInspectorArray");
														   
																 
														   
																  
														   
																   
															  

var resultCapIdStringSave = null;

for (thisElement in s_id1)
	{
	var r = new schedObj();
	var s_capResult = aa.cap.getCapID(s_id1[thisElement], s_id2[thisElement], s_id3[thisElement]);
	if(s_capResult.getSuccess())
		r.capId = s_capResult.getOutput();
	else
		logDebug("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
	r.capIdString = r.capId.getCustomID();
	r.inspId = inspIdArr[thisElement];
	r.inspector = inspInspArr[thisElement];
													
													
													
														  
	r.inspObj = aa.inspection.getInspection(r.capId,r.inspId).getOutput();
	
	schedObjArray.push(r);
	}


schedObjArray.sort(compareSchedObj);

								   
													  
																		   
														   
								
																			
															
															
	

																							   
								

for (thisResult in schedObjArray)
	{
	curResult = schedObjArray[thisResult];
	if (!curResult.capIdString.equals(resultCapIdStringSave)) // load up the CapId info
		{
		var capId = curResult.capId;
		var cap = aa.cap.getCap(capId).getOutput();				// Cap object
		var servProvCode = capId.getServiceProviderCode()       		// Service Provider Code
		var capIDString = capId.getCustomID();					// alternate cap id string
		resultCapIdStringSave = capIDString;
		var appTypeResult = cap.getCapType();
		var appTypeString = appTypeResult.toString();				// Convert application type to string ("Building/A/B/C")
		var appTypeArray = appTypeString.split("/");				// Array of application type string

		var currentUserGroup = null;
		if(appTypeArray[0].substr(0,1) !="_") //Model Home Check
			{
			var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0],currentUserID).getOutput()
			if (currentUserGroupObj) currentUserGroup = currentUserGroupObj.getGroupName();
			}

		var capName = cap.getSpecialText();
		var capStatus = cap.getCapStatus();
										 
		var fileDateObj = cap.getFileDate();					// File Date scriptdatetime
		var fileDate = "" + fileDateObj.getMonth() + "/" + fileDateObj.getDayOfMonth() + "/" + fileDateObj.getYear();
		var fileDateYYYYMMDD = dateFormatted(fileDateObj.getMonth(),fileDateObj.getDayOfMonth(),fileDateObj.getYear(),"YYYY-MM-DD");
		var parcelArea = 0;

		var estValue = 0; var calcValue = 0; var feeFactor			// Init Valuations
		var valobj = aa.finance.getContractorSuppliedValuation(capId,null).getOutput();	// Calculated valuation
		if (valobj.length) {
			estValue = valobj[0].getEstimatedValue();
			calcValue = valobj[0].getCalculatedValue();
			feeFactor = valobj[0].getbValuatn().getFeeFactorFlag();
			}

		var balanceDue = 0 ; var houseCount = 0; feesInvoicedTotal = 0;		// Init detail Data
		var capDetail = "";
		var capDetailObjResult = aa.cap.getCapDetail(capId);			// Detail
		if (capDetailObjResult.getSuccess())
			{
			capDetail = capDetailObjResult.getOutput();
			var houseCount = capDetail.getHouseCount();
			var feesInvoicedTotal = capDetail.getTotalFee();
			var balanceDue = capDetail.getBalance();
			}

		var AInfo = new Array();						// Create array for tokenized variables
		loadAppSpecific(AInfo); 						// Add AppSpecific Info
		loadTaskSpecific(AInfo);						// Add task specific info
		loadParcelAttributes(AInfo);						// Add parcel attributes
		loadASITables();
																					   
																	 
											  
				
										 
											  
											  
												

		logDebug("<B>EMSE Script Results for " + capIDString + "</B>");
		logDebug("capId = " + capId.getClass());
		logDebug("cap = " + cap.getClass());
		logDebug("currentUserID = " + currentUserID);
		logDebug("currentUserGroup = " + currentUserGroup);
		logDebug("systemUserObj = " + systemUserObj.getClass());
		logDebug("appTypeString = " + appTypeString);
		logDebug("capName = " + capName);
		logDebug("capStatus = " + capStatus);
		logDebug("fileDate = " + fileDate);
		logDebug("fileDateYYYYMMDD = " + fileDateYYYYMMDD);
		logDebug("sysDate = " + sysDate.getClass());
		logDebug("parcelArea = " + parcelArea);
		logDebug("estValue = " + estValue);
		logDebug("calcValue = " + calcValue);
		logDebug("feeFactor = " + feeFactor);
		logDebug("houseCount = " + houseCount);
		logDebug("feesInvoicedTotal = " + feesInvoicedTotal);
		logDebug("balanceDue = " + balanceDue);
		}

																			   
				
									  
																									   

								 
	if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

	logGlobals(AInfo);
												  

	//
	// Event Specific Details
	//
										
																											   
															   
																										
									
																																																   
				 

 

	inspSchedDate = aa.env.getValue("InspectionDate");
	
	
	inspInspector = curResult.inspector;
	var inspInspectorObj = aa.person.getUser(inspInspector).getOutput();
	if (inspInspectorObj) 
		{
		var InspectorFirstName = inspInspectorObj.getFirstName();
		var InspectorLastName = inspInspectorObj.getLastName();
		var InspectorMiddleName = inspInspectorObj.getMiddleName();
		}
	else
		{
		var InspectorFirstName = null;
		var InspectorLastName = null;
		var InspectorMiddleName = null;
		}
	
	
	inspGroup = curResult.inspObj.getInspection().getInspectionGroup();
	inspType = curResult.inspObj.getInspectionType();
	
	inspTime = aa.env.getValue("InspectionTime");
	

	InspectionDate = aa.env.getValue("InspectionDate");
	InspectionTime = inspTime
	InspectionType = inspType;
	InspectionGroup = inspGroup;

	logDebug("Inspection #" + thisResult);
	logDebug("inspInspector = " + inspInspector);
	logDebug("InspectorFirstName = " + InspectorFirstName);
	logDebug("InspectorMiddleName = " + InspectorMiddleName);
	logDebug("InspectorLastName = " + InspectorLastName);
	logDebug("inspObj = " + curResult.inspObj.getClass());
	logDebug("inspGroup = " + inspGroup);
	logDebug("inspType = " + inspType);
	logDebug("inspSchedDate = " + inspSchedDate);
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
	if (cancel)
		{
		aa.env.setValue("ScriptReturnCode", "1");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + message);
																																						   
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + debug);
		}
	else
		{
		aa.env.setValue("ScriptReturnCode", "0");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
																								
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", debug);
																							  
		}
	}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/
									  
								   
								 
								 
								   
								 
									
 

function schedObj()	{
	this.capId = null;
	this.capIdString = null;
	this.inspector = null;
	this.inspId = null;
	this.inspObj = null;
	}

function compareSchedObj(a,b) { return (a.capIdString < b.capIdString); }