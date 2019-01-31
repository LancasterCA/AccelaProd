

/*
  *  Program : SendReportV1.0.js
  *  Usage   : This script is invoked in Other Event Script
  *  Notes   : This is the standard function including any changes specific to DHCD.
		- systemMailFrom set to noreply@accela.com for DHCD
  *  
  */
// ********************************************************************************************************************************
//	Env Paramters Below
// ********************************************************************************************************************************
var servProvCode = aa.env.getValue("ServProvCode");			// Service Provider Code
var capId1 = aa.env.getValue("PermitId1");					// Permit ID1
var capId2 = aa.env.getValue("PermitId2");					// Permit ID1
var capId3 = aa.env.getValue("PermitId3");					// Permit ID3
var capIDString = aa.env.getValue("CustomCapId");			// Custom CAP ID
var reportName = aa.env.getValue("ReportName"); 			// Report Name
var reportParamters = aa.env.getValue("ReportParamters");	// Report Paramters, it should be HashTable
var module = aa.env.getValue("Module");						// Module Name
var reportUser = aa.env.getValue("ReportUser"); 			// AA User
var emailFrom = aa.env.getValue("EmailFrom");				// From Email Address
var emailTo = aa.env.getValue("EmailTo");					// To Email Address
var emailCC = aa.env.getValue("EmailCC");					// CC Email Address
var emailSubject = aa.env.getValue("EmailSubject");			// Email Subject
var emailContent = aa.env.getValue("EmailContent");			// Email Content

var errorEmailTo = aa.env.getValue("ErrorEmailTo");			// To Email Address handle Error Message
var debugEmailTo = aa.env.getValue("DebugEmailTo");			// To Email Address handle Debug Message
 
var debug = "";
var error = "";
var br = "<BR/>";
var systemMailFrom = "noreply@accela.com";

// ********************************************************************

logDebug("servProvCode: " +  servProvCode);
logDebug("capId1 = " +  capId1);
logDebug("capId2 = " +  capId2);
logDebug("capId3 = " +  capId3);
logDebug("capIDString = " +  capIDString);
logDebug("reportName = " +  reportName);
logDebug("reportParamters = " +  reportParamters);
logDebug("module = " +  module);
logDebug("reportUser = " +  reportUser);
logDebug("emailFrom = " +  emailFrom);
logDebug("emailTo = " +  emailTo);
logDebug("emailCC = " +  emailCC);
logDebug("emailSubject = " +  emailSubject);
logDebug("emailContent = " +  emailContent);
logDebug("errorEmailTo = " +  errorEmailTo);
logDebug("debugEmailTo = " +  debugEmailTo);

// ***********************************************************************

handleEnvParamters();

var success = sendReport();

if(errorEmailTo != null && errorEmailTo != "" && success == false) {
	aa.sendMail(systemMailFrom, errorEmailTo, "", "Errors occurs in Sending Report Script", error);
}

if(debugEmailTo != null && debugEmailTo != "") {
	aa.sendMail(systemMailFrom, debugEmailTo, "", "Debug Information in Sending Report Script", debug);
}

// ======================================================================
//
//					Internal Function
//
// ======================================================================

// Main Function to send report
function sendReport() {
	
	try {
		// Step 1.  Get Report Model by ReportName
		var reportInfoResult = aa.reportManager.getReportInfoModelByName(reportName);
		if(reportInfoResult.getSuccess() == false) {
			// Notify adimistrator via Email, for example
			logError("Could not found this report " + reportName);		
			return false;
		}
		
		// Step 2. Initialize report
		report = reportInfoResult.getOutput();
		report.setModule(module);
		report.setCapId(capId1 + "-" + capId2 + "-" + capId3 );
		report.setReportParameters(reportParamters);
		report.getEDMSEntityIdModel().setAltId(capIDString);
		
		// Step 3. Check permission on report
		var permissionResult = aa.reportManager.hasPermission(reportName,reportUser);
		if(permissionResult.getSuccess() == false || permissionResult.getOutput().booleanValue() == false) {
			// Notify adimistrator via Email, for example
			logError("The user " + reportUser + " does not have perssion on this report " + reportName);		
			return false;
		}
		
		// Step 4. Run report
		var reportResult = aa.reportManager.getReportResult(report);
		if(reportResult.getSuccess() == false){
			// Notify adimistrator via Email, for example
			logError("Could not get report from report manager normally, error message please refer to: " + reportResult.getErrorMessage());		
			return false;
		}
		
		// Step 5, Store Report File to harddisk
		reportResult = reportResult.getOutput();
	    var reportFileResult = aa.reportManager.storeReportToDisk(reportResult);
		if(reportFileResult.getSuccess() == false) {
			// Notify adimistrator via Email, for example
			logError("The appliation does not have permission to store this temporary report " + reportName + ", error message please refer to:" + reportResult.getErrorMessage());		
			return false;
		}
		
		
		// Step 6. Send Report via Email
	    var reportFile = reportFileResult.getOutput();
		var sendResult = aa.sendEmail(emailFrom, emailTo, emailCC, emailSubject, emailContent, reportFile);
		if(sendResult.getSuccess()) {
			logDebug("A copy of this report has been sent to the valid email addresses."); 
	    }
	    else {
			logError("System failed send report to selected email addresses because mail server is broken or report file size is great than 5M.");
	    }
	}
	catch(err){
		logError("One error occurs. Error description: " + err.description );
		return false;
	}	
}

function handleEnvParamters() {
	
	if(servProvCode == null) servProvCode = "";	
	if(capId1 == null) capId1 = "";
	if(capId2 == null) capId2 = "";
	if(capId3 == null) capId3 = "";
	if(capIDString == null) capIDString = "";
	if(reportName == null) reportName = "";
	if(module == null) module = "";
	if(reportUser == null) reportUser = "";
	if(emailFrom == null) emailFrom = "";
	if(emailTo == null) emailTo = "";
	if(emailCC == null) emailCC = "";
	if(emailSubject == null) emailSubject = "";
	if(emailContent == null) emailContent = "";
	if(errorEmailTo == null) errorEmailTo = "";
	if(debugEmailTo == null) debugEmailTo = "";
}

function logDebug(dstr) {
	debug += dstr + br;	
}

function logError(dstr) {
	error += dstr + br;
	logDebug(dstr);
}