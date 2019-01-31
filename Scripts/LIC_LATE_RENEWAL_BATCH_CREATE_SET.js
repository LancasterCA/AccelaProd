/*------------------------------------------------------------------------------------------------------/
	| Program: LIC_LATE_RENEWAL_BATCH_CREATE_SET.js  Trigger: Batch
	| Client:
	|
	| Version 1.0 - Base Version. 02/05/2014
	|
	/------------------------------------------------------------------------------------------------------*/
	/*------------------------------------------------------------------------------------------------------/
	|
	| START: USER CONFIGURABLE PARAMETERS
	|
	/------------------------------------------------------------------------------------------------------*/


	emailText = "";
	message = "";
	br = "<br>";
	debug = "";
	/*------------------------------------------------------------------------------------------------------/
	| BEGIN Includes
	/------------------------------------------------------------------------------------------------------*/
	SCRIPT_VERSION = 2.0

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

	//aa.env.setValue("configStdChoice","LIC_EXPIRE_CONFIG");
	var configStdChoice = getParam("configStdChoice");  // the standard choice that contains the batch renewal configuration information
	if (!configStdChoice.length) 
		configStdChoice = "LIC_EXPIRE_CONFIG";

	var showDebug = lookup(configStdChoice, "showDebug");	//debug level

	sysDate = aa.date.getCurrentDate();
	batchJobResult = aa.batchJob.getJobID()
	batchJobName = "" + aa.env.getValue("BatchJobName");
	wfObjArray = null;

	batchJobID = 0;
	if (batchJobResult.getSuccess())
	  {
	  batchJobID = batchJobResult.getOutput();
	  logDebug("Batch Job " + batchJobName + " Job ID is " + batchJobID);
	  }
	else
	  logDebug("Batch job ID not found " + batchJobResult.getErrorMessage());

	/*----------------------------------------------------------------------------------------------------/
	|
	| Start: BATCH PARAMETERS
	|
	/------------------------------------------------------------------------------------------------------*/

	var fromDate = lookup(configStdChoice, "searchFromDate");							// Hardcoded dates.   Use for testing only
	var toDate = lookup(configStdChoice, "searchToDate");								// ""
	
//	var lookAheadDays = lookup(configStdChoice, "searchDaysAhead");   		    // Number of days from today
//	var daySpan = lookup(configStdChoice, "searchDaySpan");						// Days to search (6 if run weekly, 0 if daily, etc.)
	
//	var lookAheadDays = getParam("lookAheadDays");
	var daySpan = getParam("daySpan");
	
	var appGroup = lookup(configStdChoice, "appGroup");							//   app Group to process {Licenses}
	
//	var appTypeType = lookup(configStdChoice, "appTypeType");						//   app type to process {Rental License}
//	var appSubtype = lookup(configStdChoice, "appSubtype");						//   app subtype to process {NA}
	
	var appTypeType = getParam("appTypeType");
	var appSubtype = getParam("appSubType");
	
	var appCategory = lookup(configStdChoice, "appCategory");						//   app category to process {NA}
	var expStatus = lookup(configStdChoice, "searchExpStatus")					//   test for this expiration status
	var setPrefix = lookup(configStdChoice, "setPrefix");							//   Prefix for set ID
	var skipAppStatusArray = lookup(configStdChoice, "skipAppStatus").split(",");	//   Skip records with one of these application statuses
	var maxSeconds = lookup(configStdChoice, "batchTimeout");		// number of seconds allowed for batch processing
	var emailAddress = lookup(configStdChoice, "emailAddress");					// email to send report

	/*----------------------------------------------------------------------------------------------------/
	|
	| End: BATCH PARAMETERS
	|
	/------------------------------------------------------------------------------------------------------*/
	var startDate = new Date();
	var timeExpired = false;
	if (fromDate.length < 10) // no "from" date, assume today + number of days to look ahead
		fromDate = dateAdd(null,-5000)            //fromDate = dateAdd(null,parseInt(lookAheadDays))

	if (toDate.length < 10)  {// no "to" date, assume today + number of look ahead days + span
		toDate = dateAdd(null,-parseInt(daySpan));     //toDate = dateAdd(null,parseInt(lookAheadDays)+parseInt(daySpan));
	aa.print(fromDate + ", " + toDate);

	}

	var mailFrom = lookup("ACA_EMAIL_TO_AND_FROM_SETTING","RENEW_LICENSE_AUTO_ISSUANCE_MAILFROM");
	var acaSite = lookup("ACA_CONFIGS","ACA_SITE");
	acaSite = acaSite.substr(0,acaSite.toUpperCase().indexOf("/ADMIN"));

	logDebug("Date Range -- fromDate: " + fromDate + ", toDate: " + toDate)

	var startTime = startDate.getTime();			// Start timer
	var systemUserObj = aa.person.getUser("ADMIN").getOutput();

	if (appGroup=="")
		appGroup="*";
	if (appTypeType=="")
		appTypeType="*";
	if (appSubtype=="")
		appSubtype="*";
	if (appCategory=="")
		appCategory="*";
	var appType = appGroup+"/"+appTypeType+"/"+appSubtype+"/"+appCategory;

	/*------------------------------------------------------------------------------------------------------/
	| <===========Main=Loop================>
	|
	/-----------------------------------------------------------------------------------------------------*/

	logDebug("Start of Job");

	if (!timeExpired) mainProcess();

	logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");


	emailText = debug;

	if (emailAddress.length)
		aa.sendMail("noreply@accela.com", emailAddress, "", batchJobName + " Results", emailText);


	/*------------------------------------------------------------------------------------------------------/
	| <===========END=Main=Loop================>
	/-----------------------------------------------------------------------------------------------------*/


	function mainProcess()
		{
		var capFilterType = 0
		var capFilterInactive = 0;
		var capFilterError = 0;
		var capFilterStatus = 0;
		var capDeactivated = 0;
		var capCount = 0;
		var setName;
		var setDescription;

		var expResult = aa.expiration.getLicensesByDate(expStatus,fromDate,toDate);

		if (expResult.getSuccess())
			{
			myExp = expResult.getOutput();
			logDebug("Processing " + myExp.length + " expiration records");
			}
		else
			{ logDebug("ERROR: Getting Expirations, reason is: " + expResult.getErrorType() + ":" + expResult.getErrorMessage()) ; return false }

		for (thisExp in myExp)  // for each b1expiration (effectively, each license app)
			{
			if (elapsed() > maxSeconds) // only continue if time hasn't expired
				{
				logDebug("A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.") ;
				timeExpired = true ;
				break;
				}

			b1Exp = myExp[thisExp];
			var	expDate = b1Exp.getExpDate();
			if (expDate) var b1ExpDate = expDate.getMonth() + "/" + expDate.getDayOfMonth() + "/" + expDate.getYear();
			var b1Status = b1Exp.getExpStatus();

			capId = aa.cap.getCapID(b1Exp.getCapID().getID1(),b1Exp.getCapID().getID2(),b1Exp.getCapID().getID3()).getOutput();

			if (!capId)
				{
				logDebug("Could not get a Cap ID for " + b1Exp.getCapID().getID1() + "-" + b1Exp.getCapID().getID2() + "-" + b1Exp.getCapID().getID3());
				continue;
			}

			altId = capId.getCustomID();

			logDebug(altId + ": Renewal Status : " + b1Status + ", Expires on " + b1ExpDate);

			var capResult = aa.cap.getCap(capId);

			if (!capResult.getSuccess()) {
				logDebug(altId + ": Record is deactivated, skipping");
				capDeactivated++;
				continue;
				}
			else	{
				var cap = capResult.getOutput();
				}

			var capStatus = cap.getCapStatus();

			appTypeResult = cap.getCapType();		//create CapTypeModel object
			appTypeString = appTypeResult.toString();
			appTypeArray = appTypeString.split("/");

			// Filter by CAP Type
			if (appType.length && !appMatch(appType))
				{
				capFilterType++;
				logDebug(altId + ": Record Type does not match")
				continue;
				}

			// Filter by CAP Status
			if (exists(capStatus,skipAppStatusArray))
				{
				capFilterStatus++;
				logDebug(altId + ": skipping due to record status of " + capStatus)
				continue;
				}

			capCount++;


			// Create Set
			if (setPrefix != "" && capCount == 1)
				{
				var yy = startDate.getFullYear().toString();
				var mm = (startDate.getMonth()+1).toString();
				if (mm.length<2)
					mm = "0"+mm;
				var dd = startDate.getDate().toString();
				if (dd.length<2)
					dd = "0"+dd;
				var hh = startDate.getHours().toString();
				if (hh.length<2)
					hh = "0"+hh;
				var mi = startDate.getMinutes().toString();
				if (mi.length<2)
					mi = "0"+mi;

				var setName = setPrefix.substr(0,20) + "-" + mm + dd + yy + mm + hh + mi;
				var setType = "Expired Licenses";
				var setStatus = "Ready to Process";

				setDescription = setPrefix + " : " + startDate.toLocaleString()
				var setCreateResult= aa.set.createSet(setName,setDescription);

				if (setCreateResult.getSuccess())
					logDebug("Set ID "+setName+" created for records processed by this batch job.");
				else
					logDebug("ERROR: Unable to create new Set ID "+setName+" created for CAPs processed by this batch job.");
				}

				var addMemberResult = aa.set.add(setName,capId);
				if (addMemberResult.getSuccess())
				{
					addMember = addMemberResult.getOutput();
					logDebug(altId + ": Successfully added to the Set: " + setName);
				}
				else
				{
					logDebug("Unable not add record: " + altId + " to the Set: " + setName);
				}
					
				

		}
		
		// update set type and status
		setScriptResult = aa.set.getSetByPK(setName);
		aa.print(setScriptResult);
		if (setScriptResult.getSuccess())
		{
			setScript = setScriptResult.getOutput();
			setScript.setRecordSetType(setType);
			setScript.setSetStatus(setStatus);
			aa.print(setScript.getSetStatus());
			updSet = aa.set.updateSetHeader(setScript).getOutput();
		}
		
		logDebug("Total Records qualified date range: " + myExp.length);
		logDebug("Ignored due to application type: " + capFilterType);
		logDebug("Ignored due to Record Status: " + capFilterStatus);
		logDebug("Ignored due to Deactivated Record: " + capDeactivated);
		logDebug("Total Records added to Set " + setName + ": " + capCount);
	}