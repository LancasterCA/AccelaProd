servProvCode = 'LANCASTER';

debug = "";
error = "";
br = "<BR/>";
logDebug("Here in runReportASync");


//Get environmental variables pass into the script
var reportTemplate = aa.env.getValue("ReportTemplate");
var vRParams = aa.env.getValue("vRParams");
var vChangeReportName = aa.env.getValue("vChangeReportName");
var capId = aa.env.getValue("CapId");
var module = aa.env.getValue("Module");

//Set variables used in the script
var vReportName;

//Generate report and get report name
vReportName = false;
logDebug("Report template : " + reportTemplate);
logDebug("capId = " + capId);
logDebug("module = " + module);
if (reportTemplate != '' && reportTemplate != null) {
	//generate and get report file
	vReportName = generateReport(capId, reportTemplate, aa.getServiceProviderCode(), vRParams, 'Y');

	
}

function generateReport(itemCap,reportName,module,parameters) {
	logDebug("Generating " + reportName);
	logDebug("Module = " + module);
  //returns the report file which can be attached to an email.
  var user = aa.env.getValue("CurrentUserID");

if (user == "") user = "ADMIN";
  var report = aa.reportManager.getReportInfoModelByName(reportName);
  report = report.getOutput();
  report.setModule(module);
  report.setCapId(itemCap);
  report.setReportParameters(parameters); 

  var permit = aa.reportManager.hasPermission(reportName,user);

  if (permit.getOutput().booleanValue()) {
    var reportResult = aa.reportManager.getReportResult(report);
    if(reportResult.getSuccess()) {

      reportOutput = reportResult.getOutput();
      var reportFile=aa.reportManager.storeReportToDisk(reportOutput);
      reportFile=reportFile.getOutput();
      return reportFile;
    }  else {
      logDebug("System failed get report: " + reportResult.getErrorType() + ":" +reportResult.getErrorMessage());
      return false;
    }
  } else {
    logDebug("You have no permission.");
    return false;
  }
}


function logDebug(dstr) {
	debug += dstr + br;	
	aa.debug(aa.getServiceProviderCode() + " : RUNREPROTASYNC", dstr);
}

function logMessage(dstr) {
	error += dstr + br;
	logDebug(dstr);
}