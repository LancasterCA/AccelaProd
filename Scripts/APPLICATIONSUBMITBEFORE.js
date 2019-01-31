/*------------------------------------------------------------------------------------------------------/
| SVN $Id: ApplicationSubmitBefore.js 6515 2012-03-16 18:15:38Z john.schomp $
| Program : ApplicationSubmitBeforeV2.0.js
| Event   : ApplicationSubmitBefore
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : N/A
| Action# : N/A
|
| Notes   : INCLUDES_ACCELA_GLOBALS is not called by this masterscript.
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
var controlString = "ApplicationSubmitBefore"; 	// Standard choice for control
var preExecute = "PreExecuteForBeforeEvents"
var documentOnly = false;						// Document Only -- displays hierarchy of std choice steps

/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var SCRIPT_VERSION = 2.0

eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS_ASB"));
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

logDebug("<B>EMSE Script Results</B>");

/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

var AdditionalInfoBuildingCount 	= aa.env.getValue("AdditionalInfoBuildingCount");
var AdditionalInfoConstructionTypeCode 	= aa.env.getValue("AdditionalInfoConstructionTypeCode");
var AdditionalInfoHouseCount 		= aa.env.getValue("AdditionalInfoHouseCount");
var AdditionalInfoPublicOwnedFlag 	= aa.env.getValue("AdditionalInfoPublicOwnedFlag");
var AdditionalInfoValuation 		= aa.env.getValue("AdditionalInfoValuation");
var AdditionalInfoWorkDescription 	= aa.env.getValue("AdditionalInfoWorkDescription");
var AddressCity 			= aa.env.getValue("AddressCity");
var AddressHouseFraction 		= aa.env.getValue("AddressHouseFraction");
var AddressHouseNumber 			= aa.env.getValue("AddressHouseNumber");
var AddressPrimaryFlag 			= aa.env.getValue("AddressPrimaryFlag");
var AddressState 			= aa.env.getValue("AddressState");
var AddressStreetDirection 		= aa.env.getValue("AddressStreetDirection");
var AddressStreetName 			= aa.env.getValue("AddressStreetName");
var AddressStreetSuffix 		= aa.env.getValue("AddressStreetSuffix");
var AddressUnitNumber 			= aa.env.getValue("AddressUnitNumber");
var AddressUnitType 			= aa.env.getValue("AddressUnitType");
var AddressValidatedNumber 		= aa.env.getValue("AddressValidatedNumber");
var AddressZip 				= aa.env.getValue("AddressZip");
var AppSpecificInfoModels 		= aa.env.getValue("AppSpecificInfoModels");
var ApplicantAddressLine1 		= aa.env.getValue("ApplicantAddressLine1");
var ApplicantAddressLine2 		= aa.env.getValue("ApplicantAddressLine2");
var ApplicantAddressLine3 		= aa.env.getValue("ApplicantAddressLine3");
var ApplicantBusinessName 		= aa.env.getValue("ApplicantBusinessName");
var ApplicantCity 			= aa.env.getValue("ApplicantCity");
var ApplicantContactType 		= aa.env.getValue("ApplicantContactType");
var ApplicantCountry 			= aa.env.getValue("ApplicantCountry");
var ApplicantEmail 			= aa.env.getValue("ApplicantEmail");
var ApplicantFirstName 			= aa.env.getValue("ApplicantFirstName");
var ApplicantId 			= aa.env.getValue("ApplicantId");
var ApplicantLastName 			= aa.env.getValue("ApplicantLastName");
var ApplicantMiddleName 		= aa.env.getValue("ApplicantMiddleName");
var ApplicantPhone1 			= aa.env.getValue("ApplicantPhone1");
var ApplicantPhone2 			= aa.env.getValue("ApplicantPhone2");
var ApplicantRelation 			= aa.env.getValue("ApplicantRelation");
var ApplicantState 			= aa.env.getValue("ApplicantState");
var ApplicantZip 			= aa.env.getValue("ApplicantZip");
var ApplicationSubmitMode 		= aa.env.getValue("ApplicationSubmitMode");
var ApplicationName 			= aa.env.getValue("AppSpecialText");
var ApplicationTypeLevel1 		= aa.env.getValue("ApplicationTypeLevel1");
var ApplicationTypeLevel2 		= aa.env.getValue("ApplicationTypeLevel2");
var ApplicationTypeLevel3 		= aa.env.getValue("ApplicationTypeLevel3");
var ApplicationTypeLevel4 		= aa.env.getValue("ApplicationTypeLevel4");
var CAEAddressLine1 			= aa.env.getValue("CAEAddressLine1");
var CAEAddressLine2 			= aa.env.getValue("CAEAddressLine2");
var CAEAddressLine3 			= aa.env.getValue("CAEAddressLine3");
var CAEBusinessName 			= aa.env.getValue("CAEBusinessName");
var CAECity 				= aa.env.getValue("CAECity");
var CAEEmail 				= aa.env.getValue("CAEEmail");
var CAEFirstName 			= aa.env.getValue("CAEFirstName");
var CAELastName 			= aa.env.getValue("CAELastName");
var CAELienseNumber 			= aa.env.getValue("CAELienseNumber");
var CAELienseType 			= aa.env.getValue("CAELienseType");
var CAEMiddleName 			= aa.env.getValue("CAEMiddleName");
var CAEPhone1 				= aa.env.getValue("CAEPhone1");
var CAEPhone2 				= aa.env.getValue("CAEPhone2");
var CAEState 				= aa.env.getValue("CAEState");
var CAEValidatedNumber 			= aa.env.getValue("CAEValidatedNumber");
var CAEZip 				= aa.env.getValue("CAEZip");
var ComplainantAddressLine1 		= aa.env.getValue("ComplainantAddressLine1");
var ComplainantAddressLine2 		= aa.env.getValue("ComplainantAddressLine2");
var ComplainantAddressLine3 		= aa.env.getValue("ComplainantAddressLine3");
var ComplainantBusinessName 		= aa.env.getValue("ComplainantBusinessName");
var ComplainantCity 			= aa.env.getValue("ComplainantCity");
var ComplainantContactType 		= aa.env.getValue("ComplainantContactType");
var ComplainantCountry 			= aa.env.getValue("ComplainantCountry");
var ComplainantEmail 			= aa.env.getValue("ComplainantEmail");
var ComplainantFax 			= aa.env.getValue("ComplainantFax");
var ComplainantFirstName 		= aa.env.getValue("ComplainantFirstName");
var ComplainantId 			= aa.env.getValue("ComplainantId");
var ComplainantLastName 		= aa.env.getValue("ComplainantLastName");
var ComplainantMiddleName 		= aa.env.getValue("ComplainantMiddleName");
var ComplainantPhone1 			= aa.env.getValue("ComplainantPhone1");
var ComplainantRelation 		= aa.env.getValue("ComplainantRelation");
var ComplainantState 			= aa.env.getValue("ComplainantState");
var ComplainantZip 			= aa.env.getValue("ComplainantZip");
var ComplaintDate 			= aa.env.getValue("ComplaintDate");
var ComplaintReferenceId1 		= aa.env.getValue("ComplaintReferenceId1");
var ComplaintReferenceId2 		= aa.env.getValue("ComplaintReferenceId2");
var ComplaintReferenceId3 		= aa.env.getValue("ComplaintReferenceId3");
var ComplaintReferenceSource 		= aa.env.getValue("ComplaintReferenceSource");
var ComplaintReferenceType 		= aa.env.getValue("ComplaintReferenceType");
var CurrentUserID 			= aa.env.getValue("CurrentUserID");
var OwnerFirstName 			= aa.env.getValue("OwnerFirstName");
var OwnerFullName 			= aa.env.getValue("OwnerFullName");
var OwnerLastName 			= aa.env.getValue("OwnerLastName");
var OwnerMailAddressLine1 		= aa.env.getValue("OwnerMailAddressLine1");
var OwnerMailAddressLine2 		= aa.env.getValue("OwnerMailAddressLine2");
var OwnerMailAddressLine3 		= aa.env.getValue("OwnerMailAddressLine3");
var OwnerMailCity 			= aa.env.getValue("OwnerMailCity");
var OwnerMailState 			= aa.env.getValue("OwnerMailState");
var OwnerMailZip 			= aa.env.getValue("OwnerMailZip");
var OwnerMiddleName 			= aa.env.getValue("OwnerMiddleName");
var OwnerPhone 				= aa.env.getValue("OwnerPhone");
var OwnerPrimaryFlag 			= aa.env.getValue("OwnerPrimaryFlag");
var OwnerValidatedNumber 		= aa.env.getValue("OwnerValidatedNumber");
var ParcelArea 				= aa.env.getValue("ParcelArea");
var ParcelBlock 			= aa.env.getValue("ParcelBlock");
var ParcelBook 				= aa.env.getValue("ParcelBook");
var ParcelExcemptValue 			= aa.env.getValue("ParcelExcemptValue");
var ParcelImprovedValue 		= aa.env.getValue("ParcelImprovedValue");
var ParcelLandValue 			= aa.env.getValue("ParcelLandValue");
var ParcelLegalDescription 		= aa.env.getValue("ParcelLegalDescription");
var ParcelLot 				= aa.env.getValue("ParcelLot");
var ParcelPage 				= aa.env.getValue("ParcelPage");
var ParcelParcel 			= aa.env.getValue("ParcelParcel");
var ParcelTract 			= aa.env.getValue("ParcelTract");
var ParcelValidatedNumber 		= aa.env.getValue("ParcelValidatedNumber");
var ViolationAddressLine1 		= aa.env.getValue("ViolationAddressLine1");
var ViolationAddressLine2 		= aa.env.getValue("ViolationAddressLine2");
var ViolationCity 			= aa.env.getValue("ViolationCity");
var ViolationComment 			= aa.env.getValue("ViolationComment");
var ViolationLocation 			= aa.env.getValue("ViolationLocation");
var ViolationState 			= aa.env.getValue("ViolationState");
var ViolationZip  			= aa.env.getValue("ViolationZip");

/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/
var appTypeString = ApplicationTypeLevel1 + "/" + ApplicationTypeLevel2 + "/" + ApplicationTypeLevel3 + "/" + ApplicationTypeLevel4;
var appTypeArray = appTypeString.split("/");		// Array of application type string
var currentUserID = aa.env.getValue("CurrentUserID");   // Current USer
var publicUser = false;
if (currentUserID.indexOf("PUBLICUSER") == 0) { currentUserID = "ADMIN"; publicUser = true }

var AppSpecificInfoModels = aa.env.getValue("AppSpecificInfoModels");
var servProvCode = aa.getServiceProviderCode();
var CAENumber = parseInt(CAEValidatedNumber);
var CAE;
var CAEAtt;

var AInfo = new Array()					// Associative array of appspecifc info
loadAppSpecificBefore(AInfo);

// Get CAE Attributes


if (CAENumber > 0)
	{
	var CAEResult = aa.licenseScript.getRefLicenseProfBySeqNbr(servProvCode,CAENumber)
	if (CAEResult.getSuccess())
		{ CAE=CAEResult.getOutput(); }
	else
		{ logDebug("**ERROR: getting CAE : " + CAEResult.getErrorMessage()); }
	}

if (CAE)
	CAEAtt = CAE.getLicenseModel().getAttributes();

if (CAEAtt)
	{
	itr = CAEAtt.values().iterator();
	while(itr.hasNext())
		{
		y = itr.next()
		itr2 = y.iterator();
		while (itr2.hasNext())
			{
			pam = itr2.next();
			AInfo["CAEAttribute." + pam.getAttributeName()] = pam.getAttributeValue();
			}
		}
	}

var systemUserObj = aa.person.getUser(currentUserID).getOutput();  // Current User Object
var sysDate = aa.date.getCurrentDate();

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);
/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/
//
//  Get the Standard choices entry we'll use for this App type
//  Then, get the action/criteria pairs for this app
//

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

