var showDebug = false;

var birthDate	=aa.env.getValue("birthDate");
var email	=aa.env.getValue("CONTACT::contactsModel*email");
var fein	=aa.env.getValue("CONTACT::contactsModel*fein");
var firstName	=aa.env.getValue("CONTACT::contactsModel*firstName");
var ssn		=aa.env.getValue("CONTACT::contactsModel*maskedSsn");
var businessName=aa.env.getValue("CONTACT::contactsModel*businessName");
var lastName	=aa.env.getValue("CONTACT::contactsModel*lastName");

var people = aa.people.createPeopleModel().getOutput().getPeopleModel();

var msg = "";

//people.setBirthDate() // not implemented yet
//people.setBusinessName();  // not implemented
if (email.value.length() > 0) people.setEmail(email.value);
if (fein.value.length() > 0) people.setFein(fein.value);
if (firstName.value.length() > 0) people.setFirstName(firstName.value);
if (lastName.value.length() > 0) people.setLastName(lastName.value);
if (ssn.value.length() > 0) people.setSocialSecurityNumber(ssn.value);


var peopleExists = comparePeopleStandard(people);

if (peopleExists)
	{
	form.message="*** Warning *** User already exists.  Please use search" + msg;
	expression.setReturn(form);
	}
else
	{
	//form.message="Data checked.  User is unique so far!" + msg;
	//expression.setReturn(form);
	}

	
	
function logDebug(x) { if (showDebug) msg+=x; }
	

function comparePeopleStandard(peop)
	{

	/* 
	
		this function will be passed as a parameter to the createRefContactsFromCapContactsAndLink function.
		takes a single peopleModel as a parameter, and will return the sequence number of the first G6Contact result
		returns null if there are no matches
	
		Best Practice Template Version uses the following algorithm:
		
		1.  Match on SSN/FEIN if either exist
		2.  else, match on Email Address if it exists
		3.  else, match on First, Middle, Last Name combined with birthdate if all exist
		
		This function can use attributes if desired
	*/
	

	if (peop.getSocialSecurityNumber() || peop.getFein())
		{
		var qryPeople = aa.people.createPeopleModel().getOutput().getPeopleModel();
		
		logDebug("we have a SSN " + peop.getSocialSecurityNumber() + " or FEIN, checking on that");
		qryPeople.setSocialSecurityNumber(peop.getSocialSecurityNumber());
		qryPeople.setFein(peop.getFein());
		
		var r = aa.people.getPeopleByPeopleModel(qryPeople);
		
		if (!r.getSuccess())  { logDebug("WARNING: error searching for people : " + r.getErrorMessage()); return false; }

		var peopResult = r.getOutput();
		
		if (peopResult.length > 0)
			{
			logDebug("Searched for a REF Contact, " + peopResult.length + " matches found! returning the first match : " + peopResult[0].getContactSeqNumber() );
			return peopResult[0].getContactSeqNumber();
			}
		}
		
	if (peop.getEmail())
		{
		var qryPeople = aa.people.createPeopleModel().getOutput().getPeopleModel();
		
		qryPeople.setServiceProviderCode(aa.getServiceProviderCode());	
	
		logDebug("we have an email, checking on that");
		qryPeople.setEmail(peop.getEmail());

		var r = aa.people.getPeopleByPeopleModel(qryPeople);

		if (!r.getSuccess())  { logDebug("WARNING: error searching for people : " + r.getErrorMessage()); return false; }

		var peopResult = r.getOutput();

		if (peopResult.length > 0)
			{
			logDebug("Searched for a REF Contact, " + peopResult.length + " matches found! returning the first match : " + peopResult[0].getContactSeqNumber() );
			return peopResult[0].getContactSeqNumber();
			}
		}

	if (peop.getBirthDate() && peop.getLastName() && peop.getFirstName())
		{
		var qryPeople = aa.people.createPeopleModel().getOutput().getPeopleModel();		
		logDebug("we have a name and birthdate, checking on that");
		qryPeople.setBirthDate(peop.getBirthDate());
		qryPeople.setLastName(peop.getLastName());
		qryPeople.setFirstName(peop.getFirstName());
		qryPeople.setMiddleName(peop.getMiddleName());

		var r = aa.people.getPeopleByPeopleModel(qryPeople);

		if (!r.getSuccess())  { logDebug("WARNING: error searching for people : " + r.getErrorMessage()); return false; }

		var peopResult = r.getOutput();

		if (peopResult.length > 0)
			{
			logDebug("Searched for a REF Contact, " + peopResult.length + " matches found! returning the first match : " + peopResult[0].getContactSeqNumber() );
			return peopResult[0].getContactSeqNumber();
			}
		}
		
	logDebug("ComparePeople did not find a match");
		return false;
	}