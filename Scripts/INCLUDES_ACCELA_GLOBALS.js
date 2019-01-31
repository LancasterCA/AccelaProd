/*------------------------------------------------------------------------------------------------------/
| Program : INCLUDES_ACCELA_GLOBALS.js
| Event   : N/A
|
| Usage   : Accela Global Includes.  Required for all master scripts.
|
| Notes   : 2.01  Added loading of parentCapId
|         : 2.02  Added check for CapModel environment variable
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
var showMessage = false;		// Set to true to see results in popup window
var showDebug = 1;			// Set to true to see debug messages in popup window
var disableTokens = false;		// turn off tokenizing of std choices (enables use of "{} and []")
var useAppSpecificGroupName = false;	// Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false;	// Use Group name when populating Task Specific Info Values
var enableVariableBranching = true;	// Allows use of variable names in branching.  Branches are not followed in Doc Only
var maxEntries = 99;			// Maximum number of std choice entries.  Entries must be Left Zero Padded
/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var GLOBAL_VERSION = 2.01

var cancel = false;

var vScriptName = aa.env.getValue("ScriptCode");
var vEventName = aa.env.getValue("EventName");

var startDate = new Date();
var startTime = startDate.getTime();
var message =	"";									// Message String
var debug = "";										// Debug String
var br = "<BR>";									// Break Tag
var feeSeqList = new Array();						// invoicing fee list
var paymentPeriodList = new Array();				// invoicing pay periods

var currentUserID = aa.env.getValue("CurrentUserID"); // Current User
var systemUserObj = null;  							// Current User Object
var currentUserGroup = null;						// Current User Group
var publicUserID = null;
var publicUser = false;

if (currentUserID.indexOf("PUBLICUSER") == 0){
	publicUserID = currentUserID;
	currentUserID = "ADMIN";
	publicUser = true;
}
if(currentUserID != null){
	systemUserObj = aa.person.getUser(currentUserID).getOutput();  	// Current User Object
}

var sysDate = aa.date.getCurrentDate();
var sysDateMMDDYYYY = dateFormatted(sysDate.getMonth(),sysDate.getDayOfMonth(),sysDate.getYear(),"");

var servProvCode = aa.getServiceProviderCode();


logDebug("EMSE Script Framework Versions");
logDebug("EVENT TRIGGERED: " + vEventName);
logDebug("SCRIPT EXECUTED: " + vScriptName);
logDebug("INCLUDE VERSION: " + INCLUDE_VERSION);
logDebug("SCRIPT VERSION : " + SCRIPT_VERSION);
logDebug("GLOBAL VERSION : " + GLOBAL_VERSION);


var capId = null;
var cap = null;
var capIDString = "";
var appTypeResult = null;
var appTypeString = "";
var appTypeArray = new Array();
var capName = null;
var capStatus = null;
var fileDateObj = null;
var fileDate = null;
var fileDateYYYYMMDD = null;
var parcelArea = 0;
var estValue = 0;
var calcValue = 0;
var houseCount = 0;
var feesInvoicedTotal = 0;
var balanceDue = 0;
var houseCount = 0;
var feesInvoicedTotal = 0;
var capDetail = "";
var AInfo = new Array();
var partialCap = false;
var feeFactor = "";
var parentCapId = null;
var feeEstimate = false;

if (vEventName.equals("FeeEstimateAfter4ACA")) feeEstimate = true;

if (typeof(getCapId) != "undefined")
	capId = getCapId();

if(capId == null){
	if(aa.env.getValue("CapId") != ""){
		sca = String(aa.env.getValue("CapId")).split("-");
		capId = aa.cap.getCapID(sca[0],sca[1],sca[2]).getOutput();
		}
	}

if(capId == null){
	if (aa.env.getValue("CapID") != ""){
		sca = String(aa.env.getValue("CapID")).split("-");
		capId = aa.cap.getCapID(sca[0],sca[1],sca[2]).getOutput();
		}
	}

if(capId == null){
	if (aa.env.getValue("CapModel") != ""){
		capId = aa.env.getValue("CapModel").getCapID();
		}
	}

if(capId != null){
	servProvCode = capId.getServiceProviderCode();
	capIDString = capId.getCustomID();
	cap = aa.cap.getCap(capId).getOutput();
	appTypeResult = cap.getCapType();
	appTypeString = appTypeResult.toString();
	appTypeArray = appTypeString.split("/");
	if(appTypeArray[0].substr(0,1) !="_")
	{
		var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0],currentUserID).getOutput()
		if (currentUserGroupObj) currentUserGroup = currentUserGroupObj.getGroupName();
	}
	capName = cap.getSpecialText();
	capStatus = cap.getCapStatus();
	partialCap = !cap.isCompleteCap();
	fileDateObj = cap.getFileDate();
	fileDate = "" + fileDateObj.getMonth() + "/" + fileDateObj.getDayOfMonth() + "/" + fileDateObj.getYear();
	fileDateYYYYMMDD = dateFormatted(fileDateObj.getMonth(),fileDateObj.getDayOfMonth(),fileDateObj.getYear(),"YYYY-MM-DD");
	var valobj = aa.finance.getContractorSuppliedValuation(capId,null).getOutput();
	if (valobj.length) {
		estValue = valobj[0].getEstimatedValue();
		calcValue = valobj[0].getCalculatedValue();
		feeFactor = valobj[0].getbValuatn().getFeeFactorFlag();
	}

	var capDetailObjResult = aa.cap.getCapDetail(capId);
	if (capDetailObjResult.getSuccess())
	{
		capDetail = capDetailObjResult.getOutput();
		var houseCount = capDetail.getHouseCount();
		var feesInvoicedTotal = capDetail.getTotalFee();
		var balanceDue = capDetail.getBalance();
	}

	// get first address for emails
	var capAddress = "";
	var capAddressResult1 = aa.address.getAddressByCapId(capId);
	if (capAddressResult1.getSuccess())
	               {
	               var Address = capAddressResult1.getOutput();
	               for (yy in Address)
	                              {
	                              capAddress = Address[yy].getHouseNumberStart();
	                              if (Address[yy].getStreetDirection())
	                                             capAddress += " " + Address[yy].getStreetDirection();
	                              capAddress += " " + Address[yy].getStreetName();
	                              if (Address[yy].getStreetSuffix())
	                                             capAddress += " " + Address[yy].getStreetSuffix();
	                              if (Address[yy].getUnitStart())
	                                             capAddress += " " + Address[yy].getUnitStart();
	                              capAddress += ", " + Address[yy].getCity();
	                              capAddress += " " + Address[yy].getZip();
	                              }
	               }

	loadAppSpecific(AInfo);
	loadTaskSpecific(AInfo);
	loadParcelAttributes(AInfo);
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

	var parentCapString = "" + aa.env.getValue("ParentCapID");
	if (parentCapString.length > 0) { parentArray = parentCapString.split("-"); parentCapId = aa.cap.getCapID(parentArray[0], parentArray[1], parentArray[2]).getOutput(); }
	if (!parentCapId) { parentCapId = getParent(); }
	if (!parentCapId) { parentCapId = getParentLicenseCapID(capId); }

	if (parentCapId) logDebug("parentCapId = " + parentCapId.getCustomID());
}
