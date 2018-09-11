/*------------------------------------------------------------------------------------------------------/
| Program : Interface_AE_Barb_Initiate_School_Verification.js
| Event   : Interface
|
| Usage   : 
|			
|			
|
| Client  : N/A
| Action# : N/A
|
| Notes   :
|
|
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START Configurable Parameters
|	The following script code will attempt to read the assocaite event and invoker the proper standard choices
|    
/------------------------------------------------------------------------------------------------------*/

var controlString = null;
var documentOnly = false;
aa.env.setValue("CurrentUserID","INTERFACE"); //should this be passed in from the interface?

/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var SCRIPT_VERSION = 2.0

function getScriptText(vScriptName){
	var servProvCode = aa.getServiceProviderCode();
	if (arguments.length > 1) servProvCode = arguments[1]; // use different serv prov code
	vScriptName = vScriptName.toUpperCase();	
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	try {
		var emseScript = emseBiz.getScriptByPK(servProvCode,vScriptName,"ADMIN");
		return emseScript.getScriptText() + "";	
		} catch(err) {
		return "";
	}
}

var getCapResult = aa.cap.getCapID(String(aa.env.getValue("RecordID")));

if (getCapResult.getSuccess()) {

	var useSA = false;
	var SA = null;
	var SAScript = null;
	var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_FOR_EMSE"); 
	if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") { 
		useSA = true; 	
		SA = bzr.getOutput().getDescription();
		bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_INCLUDE_SCRIPT"); 
		if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); }
		}
		
	if (SA) {
		eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",SA));
		var capId = getCapResult.getOutput();

		aa.env.setValue("PermitId1",capId.ID1);
		aa.env.setValue("PermitId2",capId.ID2);
		aa.env.setValue("PermitId3",capId.ID3);
		eval(getScriptText("INCLUDES_ACCELA_GLOBALS",SA));
		eval(getScriptText(SAScript,SA));
		}
	else {
		eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
		var capId = getCapResult.getOutput();

		aa.env.setValue("PermitId1",capId.ID1);
		aa.env.setValue("PermitId2",capId.ID2);
		aa.env.setValue("PermitId3",capId.ID3);
		eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
		}
		
	eval(getScriptText("INCLUDES_CUSTOM"));



	/*------------------------------------------------------------------------------------------------------/
	| BEGIN Event Specific Variables
	/------------------------------------------------------------------------------------------------------*/


	/*------------------------------------------------------------------------------------------------------/
	| END Event Specific Variables
	/------------------------------------------------------------------------------------------------------*/

	logGlobals(AInfo);

	/*------------------------------------------------------------------------------------------------------/
	| <===========Main=Loop================>
	|
	/-----------------------------------------------------------------------------------------------------*/
	//
	//  Get the Standard choices entry we'll use for this App type
	//  Then, get the action/criteria pairs for this app
	//
	try {
		

		eduUpdated = false;
		eduNumber = aa.env.getValue("eduNumber");
		courseNumber = aa.env.getValue("curriculumID");
		eduList = loadEducation();

		if (eduList.length > 0) {
			for(ii in eduList) {
				thisEduObj = eduList[ii];
				if (thisEduObj.eduNbr == eduNumber) {
					thisEduObj.templateObj.setTemplateValueByForm("COURSE DETAILS","Auto Verification Status","Initiated");
					thisEduObj.updateEducation();
					eduUpdated = true;
				}
			}	
		}

		if (eduUpdated) {
			cCode = courseNumber.substr(0,1);
			if(matches(cCode,"0","1","2","3","4","5","8")) 
				updateTask("Education Review","Verification Request Initiated","","");
			if(matches(cCode,"6","8")) 
				updateTask("Infection Control Course Review","Verification Request Initiated","","");
			aa.env.setValue("InterfaceReturnCode", "0"); 
			aa.env.setValue("InterfaceReturnMessage", "Success");
		}

		
	} catch (err) {
			aa.env.setValue("InterfaceReturnCode", "1"); 
			aa.env.setValue("InterfaceReturnMessage", err);
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
} else {
	aa.env.setValue("ScriptReturnCode", "1");
	aa.env.setValue("ScriptReturnMessage", "");
	aa.env.setValue("InterfaceReturnCode", "1");
	aa.env.setValue("InterfaceReturnMessage", "No such Record ID exists. Rejecting Transaction. Details of the missing record - <name and mandatory parameters>");
}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/
