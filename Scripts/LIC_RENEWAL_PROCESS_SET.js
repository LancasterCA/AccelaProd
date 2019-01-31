/*------------------------------------------------------------------------------------------------------/
| Program: LIC_RENEWAL_PROCESS_SET.js  Trigger: Batch
| Client:
|
| Version 1.0 - Base Version. 02/05/2014
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| BEGIN Initialize Variables
/------------------------------------------------------------------------------------------------------*/

/*  SCRIPT TEST PARAMETERS
var mySetID = "LIC_RENEWAL-02062014021424";
var setMemberArray = new Array(); 
var setMemberResult = aa.set.getCAPSetMembersByPK(mySetID);
if (setMemberResult.getSuccess()) 
{
	setMemberArray = setMemberResult.getOutput().toArray();
	aa.env.setValue("SetMemberArray",setMemberArray);
	aa.env.setValue("SetId",mySetID);
	aa.env.setValue("ScriptName","LIC_RENEWAL_PROCESS_SET");
} 
else 
{
	logDebug("Error: Could not find set by PK: " + mySetID);
}

*/
var debug = "";	
var br = "<BR>";
var message =	"";
var emailText = "";

var currentUserID = aa.env.getValue("CurrentUserID");
var systemUserObj = aa.person.getUser(currentUserID).getOutput();

var SetMemberArray= aa.env.getValue("SetMemberArray");
var SetId =  aa.env.getValue("SetID");
var ScriptName =  aa.env.getValue("ScriptName");

/*------------------------------------------------------------------------------------------------------/
| BEGIN Includes
/------------------------------------------------------------------------------------------------------*/
SCRIPT_VERSION = 2.0
batchJobName="";
batchJobID="";
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
sysDate = aa.date.getCurrentDate();
wfObjArray = null;

/*----------------------------------------------------------------------------------------------------/
|
| Start: SCRIPT PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/

var configStdChoice = "LIC_RENEWAL_CONFIG";  // the standard choice that contains the batch renewal configuration information
var showDebug = lookup(configStdChoice, "showDebug");	//debug level

logDebug("Processing Set: " + SetId);

var newExpStatus = lookup(configStdChoice, "newExpStatus")				//   update to this expiration status
var newAppStatus = lookup(configStdChoice, "newAppStatus")				//   update the CAP to this status
var gracePeriodDays = lookup(configStdChoice, "gracePeriodDays")				//	bump up expiration date by this many days
var inspSched = lookup(configStdChoice, "inspSched");							//   Schedule Inspection
var emailAddress = lookup(configStdChoice, "emailAddress");					// email to send report
var sendEmailToContactTypes = lookup(configStdChoice, "sendEmailToContactTypes");// send out emails?
var emailTemplate = lookup(configStdChoice, "emailTemplate");					// email Template
var deactivateLicense = lookup(configStdChoice, "deactivateLicense");			// deactivate the LP
var createRenewalRecord = lookup(configStdChoice, "createTempRenewalRecord");	// create a temporary record
var feeSched = lookup(configStdChoice, "feeSched"); 							//
var feeList = lookup(configStdChoice, "feeList");								// comma delimted list of fees to add
var feePeriod = lookup(configStdChoice, "feePeriod");							// fee period to use {LICENSE}
/*----------------------------------------------------------------------------------------------------/
|
| End: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var mailFrom = lookup("ACA_EMAIL_TO_AND_FROM_SETTING","RENEW_LICENSE_AUTO_ISSUANCE_MAILFROM");
var acaSite = lookup("ACA_CONFIGS","ACA_SITE");
acaSite = acaSite.substr(0,acaSite.toUpperCase().indexOf("/ADMIN"));

var startDate = new Date();
var startTime = startDate.getTime();			// Start timer
var systemUserObj = aa.person.getUser(currentUserID).getOutput();

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

logDebug("Start of Job");

mainProcess();

logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");

emailText = debug;

if (emailAddress.length)
	aa.sendMail("noreply@accela.com", emailAddress, "", ScriptName + " Results", emailText);


/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/


function mainProcess()
	{
	
	var capCount = 0;
	var inspDate;
	var setName;
	var setDescription;
	
	/*------------------------------------------------------------------------------------------------------/
	| <===========Main=Loop================>
	|
	/-----------------------------------------------------------------------------------------------------*/



	for(var i=0; i < SetMemberArray.length; i++) 
	{
	
	  var id= SetMemberArray[i];
	  
	  capId = aa.cap.getCapID(id.getID1(), id.getID2(),id.getID3()).getOutput();
	  
	  
		var renewalCapId = null;

		if (!capId)
			{
			logDebug("Could not get a Cap ID for " + id.getID1() + "-" + id.getID2() + "-" + id.getID3());
			continue;
		}
		
		altId = capId.getCustomID();

		// get expiration info
		var expResult = aa.expiration.getLicensesByCapID(capId);
		if(!expResult)
		{
			logDebug(altId + ": ERROR Could not get Renewal Information");
			continue;
		}
		
		var b1Exp = expResult.getOutput();
		var b1Status = b1Exp.getExpStatus();
		var	expDate = b1Exp.getExpDate();
		var b1ExpDate;
		if (expDate) b1ExpDate = expDate.getMonth() + "/" + expDate.getDayOfMonth() + "/" + expDate.getYear();
		
		logDebug(altId + ": Renewal Status : " + b1Status + ", Expires on " + b1ExpDate);

		var cap = aa.cap.getCap(capId).getOutput();

		var capStatus = cap.getCapStatus();
		
		appTypeResult = cap.getCapType();		//create CapTypeModel object
		appTypeString = appTypeResult.toString();
		appTypeArray = appTypeString.split("/");

		capCount++;

		// Actions start here:
		
		var refLic = getRefLicenseProf(altId) // Load the reference License Professional

		if (refLic && deactivateLicense.substring(0,1).toUpperCase().equals("Y"))
			{
			refLic.setAuditStatus("I");
			aa.licenseScript.editRefLicenseProf(refLic);
			logDebug(altId + ": deactivated linked License");
			}

		// update expiration status


		if (newExpStatus.length > 0 && newExpStatus != null)
			{
			b1Exp.setExpStatus(newExpStatus);
			aa.expiration.editB1Expiration(b1Exp.getB1Expiration());
			logDebug(altId + ": Update expiration status: " + newExpStatus);
			}

		// update expiration date based on interval

		if (parseInt(gracePeriodDays) != 0 && gracePeriodDays != null)
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
			var	conArray = getContactArrayCustom(capId);

			//logDebug("Have the contactArray");

			for (thisCon in conArray)
				{
				conEmail = null;
				b3Contact = conArray[thisCon];
				
				if (exists(b3Contact["contactType"],conTypeArray))
					conEmail = b3Contact["email"];
					
				aa.print("Contact Email: " + conEmail);

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
		
		

		// schedule Inspection

		if (inspSched.length > 0 && inspSched != null)
			{
			scheduleInspection(inspSched,"1");
			inspId = getScheduledInspId(inspSched);
			if (inspId) autoAssignInspection(inspId);
			//logDebug(altId + ": Scheduled " + inspSched + ", Inspection ID: " + inspId);
			}
		// update CAP status
		if (newAppStatus.length > 0 && newAppStatus != null && newAppStatus != "null")
		{
			updateAppStatus(newAppStatus, "", capId);
		}

		// create renewal record and add fees
		
		if (createRenewalRecord && createRenewalRecord.substring(0,1).toUpperCase().equals("Y")) {
			createResult = aa.cap.createRenewalRecord(capId);
			
			if (!createResult.getSuccess()) 
				{ logDebug("Could not create renewal record : " + createResult.getErrorMessage()); }
			else {
				renewalCapId = createResult.getOutput();
				aa.print("created renewal record: " + renewalCapId);
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

	// update set type and status
	setScriptResult = aa.set.getSetByPK(SetId);
	if (setScriptResult.getSuccess())
	{
		setScript = setScriptResult.getOutput();
		setScript.setSetStatus("Completed");
		updSet = aa.set.updateSetHeader(setScript).getOutput();
	}
			
 	logDebug("Total Records in set: " + SetMemberArray.length);
 	logDebug("Total Records processed: " + capCount);
	
	aa.env.setValue("ScriptReturnCode","0");
	aa.env.setValue("ScriptReturnMessage", "Update Set successful - License Renewal Process Script"); 
	
} 

function getContactArrayCustom(capId)
   {
   // Returns an array of associative arrays with contact attributes.  Attributes are UPPER CASE
   // optional capid
   var thisCap = capId;

   var cArray = new Array();

   var capContactResult = aa.people.getCapContactByCapID(thisCap);
   if (capContactResult.getSuccess())
      {
      var capContactArray = capContactResult.getOutput();
      for (yy in capContactArray)
         {
         var aArray = new Array();
		 
         aArray["lastName"] = capContactArray[yy].getPeople().lastName;
         aArray["firstName"] = capContactArray[yy].getPeople().firstName;
         aArray["businessName"] = capContactArray[yy].getPeople().businessName;
         aArray["contactSeqNumber"] =capContactArray[yy].getPeople().contactSeqNumber;
         aArray["contactType"] =capContactArray[yy].getPeople().contactType;
         aArray["relation"] = capContactArray[yy].getPeople().relation;
         aArray["phone1"] = capContactArray[yy].getPeople().phone1;
         aArray["phone2"] = capContactArray[yy].getPeople().phone2;
         aArray["phone2countrycode"] = capContactArray[yy].getCapContactModel().getPeople().getPhone2CountryCode();
         aArray["email"] = capContactArray[yy].getCapContactModel().getPeople().getEmail();
		 aArray["preferredChannel"] = capContactArray[yy].getCapContactModel().getPreferredChannel();
		 
		// var capcontact = capContactArray[yy].getCapContactModel();
		 //for (xxx in capcontact) aa.print(capcontact[xxx]);

         var pa = capContactArray[yy].getCapContactModel().getPeople().getAttributes().toArray();
                   for (xx1 in pa)
                        aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;
         cArray.push(aArray);
         }
      } 
   return cArray;
   }
