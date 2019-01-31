/*------------------------------------------------------------------------------------------------------/
| Program: Batch_Create_DS_ACA_Payments.js  Trigger: Batch
| Client: Lancaster CA
| Partner:  Silver Lining Solutions, Copywrite 2018
|
| Frequency: Run Daily
|
| Desc: This batch script will create a DS ACA Payments report and Email it to Lancaster 
| Financial Group on a daily bases.
|
/------------------------------------------------------------------------------------------------------*/
//use the following for Script Tester  

//aa.env.setValue("showDebug","Y");
//aa.env.setValue("BatchJobName", "Create DSACAPayments");
//aa.env.setValue("emailAddress","jason@esilverliningsolutions.com");

/*------------------------------------------------------------------------------------------------------/
|
| START: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
emailText = "";
maxSeconds = 6 * 60;		// number of seconds allowed for batch processing, usually < 5*60
message = "";
br = "<br>";
showDebug = "Y";
/*------------------------------------------------------------------------------------------------------/
| BEGIN Includes
/------------------------------------------------------------------------------------------------------*/
SCRIPT_VERSION = 3.0;


eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_BATCH"));
eval(getScriptText("INCLUDES_CUSTOM"));


function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
	return emseScript.getScriptText() + "";
}

function getMasterScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(),vScriptName);
	return emseScript.getScriptText() + "";
}

/*------------------------------------------------------------------------------------------------------/
|
| END: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
showDebug = false;

if (String(aa.env.getValue("showDebug")).length > 0) {
	showDebug = aa.env.getValue("showDebug").substring(0, 1).toUpperCase().equals("Y");
}


sysDate = aa.date.getCurrentDate();

/* =-=-=-=-=-=-=-=-=-for testing use the following line... when live uncomment section =-=-=-=-=-=-=-=- */
batchJobResult = aa.batchJob.getJobID()
batchJobName = "" + aa.env.getValue("BatchJobName");
wfObjArray = null;

batchJobID = 0;
/* =-=-=-=-=-=-=-=-=- */
if (batchJobResult.getSuccess())
  {
  batchJobID = batchJobResult.getOutput();
  emailText += br+"Batch Job " + batchJobName + " Job ID is " + batchJobID;
  }
else
  emailText += br+"Batch job ID not found " + batchJobResult.getErrorMessage();
/* =-=-=-=-=-=-=-=-=- */
/*----------------------------------------------------------------------------------------------------/
|
| Start: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/

var emailAddress = getParam("emailAddress"); // email to send report

/*----------------------------------------------------------------------------------------------------/
|
| End: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var timeExpired = false;

var startTime = startDate.getTime();			// Start timer
var systemUserObj = aa.person.getUser("ADMIN").getOutput();

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

//emailText += msgText;
emailText += br+"Start of Job";

if (!timeExpired) mainProcess();

//msgText = ;
//emailText += msgText + "\n";
emailText += br+"End of Job: Elapsed Time : " + elapsed() + " Seconds";

aa.print(emailText);

if (emailAddress.length) {
	var emailSentOK = email(emailAddress,"noreply@cityoflancaster.org", batchJobName + " Results", emailText);
	if (!emailSentOK) {
		emailText += br+"EMAIL COULD NOT BE SENT! >" + emailSentOK ;
	}
	else {
		aa.print("EMAIL SENT.");
//		emailText +=(emailText);
	}
}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

function mainProcess() {
	var reportDate = new Date();
	reportDate.setDate(reportDate.getDate() - 1);
	var curMonth = ("0" + (reportDate.getMonth() + 1)).slice(-2);
	var curDay = ("0" + (reportDate.getDate() )).slice(-2);
	   
			//Generate the Report 
						var myParams = aa.util.newHashMap();
						myParams.put ("p1Value", curMonth + "/" + curDay + "/" + reportDate.getFullYear());
						var tmpRPTFName = "DS_ACA_Payments_"+ reportDate.getFullYear() + curMonth + reportDate.getDate() + ".xls";
emailText += br+"the file name is>"+tmpRPTFName+"<";
//printObjProperties(myParams);
emailText += br+ curMonth + "/" + curDay + "/" + reportDate.getFullYear();
						generateReportAndEmail("DS-ACA Payments", myParams,"Licenses",tmpRPTFName,emailAddress,"DS_ACA_Payments");

		return
}

function generateReportAndEmail(aaReportName,parameters,rModule,rptFileName,emlAddress,emlTemplate) {
	var reportName = aaReportName;
	var reportResult;

    var report = aa.reportManager.getReportInfoModelByName(reportName);
	report = report.getOutput();
    report.setModule(rModule);
   
    report.setReportParameters(parameters);
    var canRunReport = aa.reportManager.hasPermission(reportName,"ADMIN");
	
    if(canRunReport.getOutput().booleanValue()) {
		//printObjProperties(report);
		emailText +=br+parameters;
		var reportResult = aa.reportManager.getReportResult(report);
		if(reportResult) {
			reportResult = reportResult.getOutput();
		   
			if (reportResult) {

				var myReportFileName = reportResult.name;
				emailText +=br+ myReportFileName;
				printObjProperties (reportResult.getReportResultModel());
				var myNewRptFileName = rptFileName;
				itWorkedForMe = reportResult.getReportResultModel().setName(myNewRptFileName);
				var myNReportFileName = reportResult.name;
				var reportFile = aa.reportManager.storeReportToDisk(reportResult);
				reportFile = reportFile.getOutput();
//-------------------------- Start of Attachment to Email -----------------------------------			
				var toEmail = emlAddress;
				var fromEmail = "noreply@cityoflancaster.org";
				var ccEmail = "";
				var notificationTemplate = emlTemplate;
				var reportFile = [reportFile];  // empty set for the file list
				//reportFile.push(reportResult);
				var emailParameters = aa.util.newHashtable(); 
				
			addParameter(emailParameters, "$$today$$", parameters["p1Value"]);
			
				// send Notification
					var sendResult = aa.document.sendEmailByTemplateName(fromEmail,toEmail,ccEmail,notificationTemplate,emailParameters,reportFile);
					if (!sendResult) 
						{ emailText +=br+"UNABLE TO SEND NOTICE!  ERROR: "+sendResult; }
					else
						{ emailText +=br+"Sent Notification"; }

// ------------------------- End of Attachment to Email --------------------------------
			}
			else {
				logMessage("Report returned no result: "+ reportName + " for Admin" + systemUserObj);
				emailText +=br+"Report returned no result: "+ reportName + " for Admin" + systemUserObj;
			}
		} else {
			logMessage("Unable to run report: "+ reportName + " for Admin" + systemUserObj);
			emailText +=br+"Unable to run report: "+ reportName + " for Admin" + systemUserObj;
			return false;
		}
	} else {
		logMessage("No permission to report: "+ reportName + " for Admin" + systemUserObj);
		emailText +=br+"No permission to report: "+ reportName + " for Admin" + systemUserObj;
		return false;
	} 
}

function printObjProperties(obj){
   var idx;

   if(obj.getClass != null){
       emailText +=br+"************* " + obj.getClass() + " *************";
   }
    else {
        emailText +=br+"this is not an object with a class!";
    }

   for(idx in obj){
       if (typeof (obj[idx]) == "function") {
           try {
               emailText +=br+idx + "==>  " + obj[idx]();
           } catch (ex) { }
       } else {
           emailText +=br+idx + ":  " + obj[idx];
       }
   }
}