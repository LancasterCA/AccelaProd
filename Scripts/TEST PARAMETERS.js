/*------------------------------------------------------------------------------------------------------/
| Program: TestParameters.js  Trigger: TestParameters    Client : N/A   SAN# : N/A
/------------------------------------------------------------------------------------------------------*/

var showDebug = true;				// Set to true to see debug messages in popup window
var br = "<BR>";
/*----------------------------------------------------------------------------------------------------/
|
| END USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/


var debug = "";

x = aa.env.getParamValues()

keys = x.keys();

while ( keys.hasMoreElements() )
   {
   key = keys.nextElement();
   val1 = x.get(key);
   
   logDebug(key + " = " + val1);
   } 

aa.env.setValue("ScriptReturnCode", "0");
aa.env.setValue("ScriptReturnMessage", debug);



function logDebug(dstr)
	{
	debug+=dstr + br;
	}