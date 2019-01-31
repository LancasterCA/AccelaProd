/*---- User intial parameters ----*/
var from = "ethan.mo@achievo.com";
var cc = "ethan.mo@achievo.com";
var acaWebServiceSite = "http://aa-demo.achievo.com/710/DEMO";
var templateName = "NOTICE_OF_EXAM_READY_TO_SCHEDULE";
/*---- User intial parameters end----*/
/*---- Inital environment parameters ----*/
var taskStatus = aa.env.getValue("WorkflowStatus");
var processCode = aa.env.getValue("PROCESSCODE");
var to;
/*---- Inital environment parameters end----*/

function sendMail()
{
	var capIDModel = getCapID();
	if(capIDModel == null)
	{
		aa.print("No email sent.");
		return;
	}
	var examModelListResult = aa.examination.getAvailableExamAfterWorkflowUpdated(getCapIDScirptModel(capIDModel));
	if(!examModelListResult.getSuccess() || examModelListResult.getOutput() == null  || examModelListResult.getOutput().size() == 0)
	{
		aa.print("No exam available.");
		return;
	}
	var examModelList = examModelListResult.getOutput();
	var fileNames = [];
	var to = getCapPrimaryContactEmail(capIDModel);
	if(to != "")
	{
		var isSuccess = aa.document.sendEmailAndSaveAsDocument(from, to, cc, templateName, getParams(examModelList), getCapIDScirptModel(capIDModel), fileNames);
		if(isSuccess.getSuccess())
		{
			aa.print("Sent email successfully.");
		}
		else
		{
			aa.print("Sent email failed.");
		}
	}
	else
	{
		aa.print("Email address is empty.");
	}
}

function getParams(examModelList)
{
	var params = aa.util.newHashtable();
	var capIDModel = getCapID();
	addParameter(params, "$$PrimaryContactName$$", getCapPrimaryContactName(capIDModel));
	addParameter(params, "$$RecordType$$", getCapType(capIDModel));
	addParameter(params, "$$AlternateID$$", getAltID(capIDModel));
	addParameter(params, "$$Url$$", getACAUrl());
	addParameter(params, "$$TaskName$$", aa.env.getValue("WorkflowTask"));
	addParameter(params, "$$TaskStatus$$", aa.env.getValue("WorkflowStatus"));
	var examName = "";
	var examComments = "";
	var examModel = null;
	for(var i=0; i<examModelList.size(); i++)
	{
		examModel = examModelList.get(i);
		if(examName != "" && examModel.getExamName() != "" && examModel.getExamName() != "null")
		{
			examName += "; ";
		}
		if(examModel.getExamName() != "" && examModel.getExamName() != "null")
		{
			examName += examModel.getExamName();
		}
		
		if(examComments != "" && examModel.getComments() != "" && examModel.getComments() != null && examModel.getComments() != "null")
		{
			examComments += "; "
		}
		if(examModel.getComments() != null && examModel.getComments() != "" && examModel.getComments() != "null")
		{
			examComments += examModel.getComments();
		}
	}
	addParameter(params, "$$ExaminationName$$", examName);
	addParameter(params, "$$ExaminationComment$$", examComments);
	return params;
}


function getACAUrl()
{
	var acaUrl = "";
	var id1 = aa.env.getValue("PermitId1");
	var id2 = aa.env.getValue("PermitId2");
	var id3 = aa.env.getValue("PermitId3");
	var capResult = aa.cap.getCap(id1, id2, id3);
	if(!capResult.getSuccess())
	{
		return acaUrl;
	}
	var cap = capResult.getOutput().getCapModel();
	acaUrl = acaWebServiceSite + "/urlrouting.ashx?type=1000";	
	acaUrl += "&Module=" + cap.getModuleName();
	acaUrl += "&capID1=" + id1 + "&capID2=" + id2 + "&capID3=" + id3;
	acaUrl += "&agencyCode=" + aa.getServiceProviderCode();
	return acaUrl;
}

function addParameter(pamaremeters, key, value)
{
	if(key != null)
	{
		if(value == null)
		{
			value = "";
		}
		pamaremeters.put(key, value);
	}
}

function getCapType(capIDModel)
{
	var capType = "";
	var capScriptModel = aa.cap.getCap(capIDModel);
	if(capScriptModel.getSuccess() && capScriptModel.getOutput() != null)
	{
		capType = capScriptModel.getOutput().getCapType().toString();
	}
	return capType;
}

function getCapIDScirptModel(capIDModel)
{
	var capIDScriptModel = aa.cap.createCapIDScriptModel(capIDModel.getID1(), capIDModel.getID2(), capIDModel.getID3());
	return capIDScriptModel;
}

function getCapPrimaryContactEmail(capIDModel)
{
	var capContactResult = aa.cap.getCapPrimaryContact(getCapIDScirptModel(capIDModel));
	if (capContactResult.getSuccess())
	{
		var capContact = capContactResult.getOutput();
		if (capContact != null && capContact.getPeople() != null && capContact.getPeople().getEmail())
		{
			return capContact.getPeople().getEmail();
		}
	}
	return "";
}

function getCapPrimaryContactName(capIDModel)
{
	var capContactResult = aa.cap.getCapPrimaryContact(getCapIDScirptModel(capIDModel));
	var contactName = "";
	if (capContactResult.getSuccess())
	{
		var capContact = capContactResult.getOutput();
		if (capContact != null)
		{
			if(capContact.getFirstName() != null)
			{
				contactName += capContact.getFirstName() + " ";
			}
			if(capContact.getMiddleName() != null)
			{
				contactName += capContact.getMiddleName() + " ";
			}
			if(capContact.getLastName() != null)
			{
				contactName += capContact.getLastName();
			}
		}
	}
	return contactName;
}

function getAltID(capIDModel)
{
	var altID = "";
	var capScriptModel = aa.cap.getCap(capIDModel);
	if(capScriptModel.getSuccess() && capScriptModel.getOutput() != null)
	{
		altID = capScriptModel.getOutput().getCapModel().getAltID();
	}
	return altID;
}

function getCapID()
{
	var id1 = aa.env.getValue("PermitId1");
	var id2 = aa.env.getValue("PermitId2");
	var id3 = aa.env.getValue("PermitId3");
	var capIDResult = aa.cap.getCapID(id1, id2, id3);
	if(capIDResult.getSuccess())
	{
		return capIDResult.getOutput();
	}
	return null;
}
aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage","Examination available.");
sendMail();
