//****************************************************************
//  Accela Script include
//****************************************************************

eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));

//function addLookup(stdChoice,stdValue,stdDesc)
//function editLookup(stdChoice,stdValue,stdDesc);
//function lookup(stdChoice,stdValue)

//****************************************************************
//  Accela Script include override
//****************************************************************

aa.print("Enter relayTrustAccountTransactionsBatchScript.js");

//****************************************************************
//  Batch parameter variable declarations
//****************************************************************

var transactionDateOffset = 1;
var url = "";
var login = "";
var password = "";

//****************************************************************
//  Script variable declarations
//****************************************************************

var showDebug = 1;
var showMessage = true;
var debug = "";
var message = "";
var br = "<br/>";

var SCRIPT_VERSION = 3.0;
aa.print("<br/>SCRIPT_VERSION: " + SCRIPT_VERSION);

//****************************************************************
//  Test batch parameter initializations
//****************************************************************

//aa.env.setValue("<br/>transactionDateOffset", "1");
//aa.env.setValue("<br/>url", "http://gc.woolpert.com/lancaster.cayenta.web/api/trustaccount");
//aa.env.setValue("<br/>login", "login");
//aa.env.setValue("<br/>password", "password");

//****************************************************************
//  Batch parameter initializations
//****************************************************************

transactionDateOffset = parseInt(aa.env.getValue("transactionDateOffset"));
aa.print("<br/>transactionDateOffset: " + transactionDateOffset);

url = aa.env.getValue("url");
aa.print("<br/>url: " + url);

login = aa.env.getValue("login");
aa.print("<br/>login: " + login);

password = aa.env.getValue("password");
aa.print("<br/>password: " + password);

//****************************************************************
//  Main execution path
//****************************************************************

try {

    var objectMapper = new org.codehaus.jackson.map.ObjectMapper();

    var transactionDate = aa.util.dateDiff(aa.util.now(), "day", (-1 * transactionDateOffset));
    aa.print("<br/>transactionDate:" + transactionDate);

    var transactionModel = {
        "eventDate": aa.util.now(),
        "trustAccounts" : null
    };

    transactionModel.trustAccounts = getTrustAccountTransactions(transactionDate);        

    var transactionModelString = objectMapper.writeValueAsString(transactionModel);
    aa.print("<br/>transactionModelString: " + transactionModelString);

    doHttpPostRequest(login, password, url, transactionModelString, "application/json");

} catch (exception) {

    var subject = "relayTrustAccountTransactionsBatchScript.js processing error alert";
    var message = "";

    try { message += "Exception caught in relayTrustAccountTransactionsBatchScript.js\n" } catch (_exception) { }
    try { message += "exception: " + exception + "\n"; } catch (_exception) { }
    try { message += "exception.fileName: " + exception.fileName + "\n"; } catch (_exception) { }
    try { message += "exception.lineNumber: " + exception.lineNumber + "\n"; } catch (_exception) { }
    try { message += "exception.message: " + exception.message + "\n"; } catch (_exception) { }
    try { message += "exception.name: " + exception.name + "\n"; } catch (_exception) { }
    try { message += "exception.rhinoException: " + exception.rhinoException + "\n"; } catch (_exception) { }
    try { message += "exception.stack: " + exception.stack + "\n"; } catch (_exception) { }

    aa.debug(subject, message);
    aa.print(message);
}

//****************************************************************
//  Processing function definitions
//****************************************************************

function getTrustAccountTransactions(transactionDate) {
    aa.print("<br/>Enter getTrustAccountTransactions()");

    //http://www.docjar.org/docs/api/org/jboss/resource/adapter/jdbc/jdk5/WrappedPreparedStatementJDK5.html
    //https://msdn.microsoft.com/en-us/library/ms378188(v=sql.110).aspx

    var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
    var datastore = initialContext.lookup("java:/AA");
    var connection = datastore.getConnection();

    var getTrustAccountTransactionsSqlString = "";

    getTrustAccountTransactionsSqlString += "SELECT	";
    getTrustAccountTransactionsSqlString += "	RACCOUNT.ACCT_SEQ_NBR, ";
    getTrustAccountTransactionsSqlString += "	F4ACCT_TRANSACTION.TRANS_SEQ_NBR, ";
    getTrustAccountTransactionsSqlString += "	F4ACCT_TRANSACTION.REC_DATE ";
    getTrustAccountTransactionsSqlString += "FROM ";
    getTrustAccountTransactionsSqlString += "	RACCOUNT ";
    getTrustAccountTransactionsSqlString += "		JOIN ";
    getTrustAccountTransactionsSqlString += "	F4ACCT_TRANSACTION ON (	";
    getTrustAccountTransactionsSqlString += "		RACCOUNT.ACCT_SEQ_NBR = F4ACCT_TRANSACTION.ACCT_SEQ_NBR	";
    getTrustAccountTransactionsSqlString += "			AND	";
    getTrustAccountTransactionsSqlString += "		RACCOUNT.ACCT_ID = F4ACCT_TRANSACTION.ACCT_ID ";
    getTrustAccountTransactionsSqlString += "	) ";
    getTrustAccountTransactionsSqlString += "WHERE ";
    getTrustAccountTransactionsSqlString += "    RACCOUNT.SERV_PROV_CODE = ? ";
    getTrustAccountTransactionsSqlString += "        AND ";
    getTrustAccountTransactionsSqlString += "    F4ACCT_TRANSACTION.SERV_PROV_CODE = ? ";
    getTrustAccountTransactionsSqlString += "        AND ";
    getTrustAccountTransactionsSqlString += "	( ";
    getTrustAccountTransactionsSqlString += "		F4ACCT_TRANSACTION.REC_DATE >= ? ";
    getTrustAccountTransactionsSqlString += "			AND	";
    getTrustAccountTransactionsSqlString += "		F4ACCT_TRANSACTION.REC_DATE < ? ";
    getTrustAccountTransactionsSqlString += "	) ";    
    getTrustAccountTransactionsSqlString += "ORDER BY ";
    getTrustAccountTransactionsSqlString += "	F4ACCT_TRANSACTION.REC_DATE ";

    //aa.print(getTrustAccountTransactionsSqlString);

    var _objectMapper = new org.codehaus.jackson.map.ObjectMapper();

    var beginDate = aa.util.dateDiff(transactionDate, "day", 0);
    beginDate.setHours(0);
    beginDate.setMinutes(0);
    beginDate.setSeconds(0);
    //aa.print("beginDate: " + beginDate);

    var sqlBeginDate = new java.sql.Timestamp(
        beginDate.getYear(),
        beginDate.getMonth(),
        beginDate.getDate(),
        0,
        0,
        0,
        0
    );
    //aa.print("sqlBeginDate: " + sqlBeginDate);

    var endDate = aa.util.dateDiff(transactionDate, "day", 1);
    endDate.setHours(0);
    endDate.setMinutes(0);
    endDate.setSeconds(0);
    //aa.print("endDate: " + endDate);

    var sqlEndDate = new java.sql.Timestamp(
        endDate.getYear(),
        endDate.getMonth(),
        endDate.getDate(),
        0,
        0,
        0,
        0
    );
    //aa.print("sqlEndDate: " + sqlEndDate);

    var trustAccountTransactions = [];

    var sqlStatement = connection.prepareStatement(getTrustAccountTransactionsSqlString);

    sqlStatement.setString(1, aa.getServiceProviderCode());
    sqlStatement.setString(2, aa.getServiceProviderCode());
    sqlStatement.setTimestamp(3, sqlBeginDate);
    sqlStatement.setTimestamp(4, sqlEndDate);

    var recordset = sqlStatement.executeQuery();
    while (recordset.next()) {

        var ACCT_SEQ_NBR = recordset.getLong("ACCT_SEQ_NBR");
        //aa.print("ACCT_SEQ_NBR: " + ACCT_SEQ_NBR);

        var TRANS_SEQ_NBR = recordset.getLong("TRANS_SEQ_NBR");
        //aa.print("TRANS_SEQ_NBR: " + TRANS_SEQ_NBR);

        var REC_DATE = recordset.getTimestamp("REC_DATE");
        //aa.print("REC_DATE: " + REC_DATE);

        trustAccountTransactions.push(
            {
                ACCT_SEQ_NBR: ACCT_SEQ_NBR,
                TRANS_SEQ_NBR: TRANS_SEQ_NBR,
                REC_DATE: REC_DATE
            }
        );

    }

    sqlStatement.close();
    connection.close();
    
    var accountSequenceNumbers = [];
    var trustAccountTransactionObjects = [];

    for (trustAccountTransactionIndex in trustAccountTransactions) {

        var trustAccountTransactionItem = trustAccountTransactions[trustAccountTransactionIndex];

        if (accountSequenceNumbers.indexOf(trustAccountTransactionItem.ACCT_SEQ_NBR) == -1) {
            accountSequenceNumbers.push(trustAccountTransactionItem.ACCT_SEQ_NBR);
        }
    }

    for (accountSequenceNumberIndex in accountSequenceNumbers) {

        accountSequenceNumber = accountSequenceNumbers[accountSequenceNumberIndex];
        //aa.print("accountSequenceNumber: " + accountSequenceNumber);

        var getTrustAccountByPKScriptResult = aa.trustAccount.getTrustAccountByPK(accountSequenceNumber, aa.getServiceProviderCode());
        if (getTrustAccountByPKScriptResult.getSuccess()) {

            var trustAccount = getTrustAccountByPKScriptResult.getOutput();
            trustAccountString = objectMapper.writeValueAsString(trustAccount)
            trustAccount = JSON.parse(trustAccountString);
            
            var _trustAccountTransactions = [];

            for (i = 0; i < trustAccountTransactions.length; i++) {
                var trustAccountTransaction = trustAccountTransactions[i];
                if (trustAccountTransaction.ACCT_SEQ_NBR == accountSequenceNumber) {
                    var getTransactionByPKScriptResult = aa.trustAccount.getTransactionByPK(trustAccountTransaction.TRANS_SEQ_NBR, aa.getServiceProviderCode());
                    if (getTransactionByPKScriptResult.getSuccess()) {
                        _trustAccountTransactions.push(getTransactionByPKScriptResult.getOutput());
                    }                    
                }
            }

            trustAccount.trustAccountTransactions = _trustAccountTransactions

            trustAccountTransactionObjects.push(trustAccount);
        }
    }

    aa.print("<br/>Exit getTrustAccountTransactions()");
    return trustAccountTransactionObjects;
}

//****************************************************************
//  Utility function defitinions
//****************************************************************

function doHttpPostRequest(username, password, url, body, contentType) {
    aa.print("<br/>Enter doHttpPostRequest()");

    aa.print("<br/>username: " + username);
    aa.print("<br/>password: " + password);
    aa.print("<br/>url: " + url);
    aa.print("<br/>body.length: " + body.length);
    aa.print("<br/>contentType: " + contentType);

    var post = new org.apache.commons.httpclient.methods.PostMethod(url);
    var client = new org.apache.commons.httpclient.HttpClient();

    // ---- Authentication ---- //
    if(username !== null && password !== null){
        var creds = new org.apache.commons.httpclient.UsernamePasswordCredentials(username, password);
        client.getParams().setAuthenticationPreemptive(true);
        client.getState().setCredentials(org.apache.commons.httpclient.auth.AuthScope.ANY, creds);
    }
    // -------------------------- //

    post.setRequestHeader("Content-type", contentType);
    
    post.setRequestEntity(
        new org.apache.commons.httpclient.methods.StringRequestEntity(body, contentType, "UTF-8")
    );

    var status = client.executeMethod(post);

    if(status >= 400){
        throw "HTTP Error: " + status;
    }
    
    var br = new java.io.BufferedReader(new java.io.InputStreamReader(post.getResponseBodyAsStream()));
    var response = "";
    var line = br.readLine();
    while(line != null){
        response = response + line;
        line = br.readLine();
    }

    post.releaseConnection();

    aa.print("<br/>status: " + status);
    aa.print("<br/>response: " + response);

    aa.print("<br/>Exit doHttpPostRequest()");
    return response;
}

function getScriptText(vScriptName) {
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
    return emseScript.getScriptText() + "";
}

function printObject(item, tabs) {

    try {

        if (typeof (item.getClass) != "undefined") {
            aa.print(item.getClass());
        }

        tabs = tabs + "\t";

        var properties = [];

        for (property in item) {
            properties.push(property);
        }

        properties.sort();

        for (var i = 0; i < properties.length; i++) {
            var name = properties[i];
            var property = item[name];
            aa.print(tabs + name + ": " + typeof (property));
        }

        aa.print("\n");

    } catch (exception) {
        aa.print(exception);
    }
}

aa.print("<br/>Exit relayTrustAccountTransactionsBatchScript.js");