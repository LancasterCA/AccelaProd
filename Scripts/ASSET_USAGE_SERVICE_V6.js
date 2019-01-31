/*------------------------------------------------------------------------------------------------------/
| Program		: ASSET_USAGE_SERVICE_V6.js
|
| Usage			: this script is used to sync usage attribute with usage portlet
| Notes			: service script to be called from Rest API 
| Special Note  : This script was custom developed to be executed from Lancaster GasBoy batch interface (.NET)
| Created by	: Sleiman KOZAIZAN
| Created at	: 25/05/2017 13:25:46
| Updated by	: Louis Salas
| Updated at	: 27/05/2017 11:37:00| PST
| Updated at	: 15/07/2017 13:00:00| PST  -- added back logic to update custom attribute field
| Updated at	: 08/06/2017 20:24:00| PST - modified for updateASI fix
| Updated at	: 06/21/2018 17:18:00| PST - added fixes to address issues after 9.3.x AA upgrade
| Updated at	: 07/14/2018 22:00:00| PST - added call to addAssetFuelUsage.  Modified addAssetFuelUsage function.
| Input			: ASSETID->the ID of the asset
| Output		: SUCCESS-> true /false,  Reading Difference
|				  ERROR-> the error message in case of failure

/------------------------------------------------------------------------------------------------------*/

/*
//testing usage: Input parameters
aa.env.setValue("ASSET_ID", "5708");
aa.env.setValue("USAGE_AMOUNT", "5100");
aa.env.setValue("USAGE_DATE", "07/15/2017 11:35:00");
aa.env.setValue("FUEL_TYPE", "Gasoline");
aa.env.setValue("FUEL_QUANTITY", "20");
aa.env.setValue("COMMENT", "Batch#:ScriptTest");
aa.env.setValue("ASSET_CUSTOM_ATTRIBUTE", "Mileage");
*/

//last mileage: 66564

/*
testing usage: Input parameters
aa.env.setValue("ASSET_ID", "1510");
aa.env.setValue("USAGE_AMOUNT", "66570");
aa.env.setValue("USAGE_DATE", "07/16/2017 11:35:00");
aa.env.setValue("FUEL_TYPE", "Unleaded Regular");
aa.env.setValue("FUEL_QUANTITY", "12.5");
aa.env.setValue("COMMENT", "Batch#:ScriptTest 111");
aa.env.setValue("ASSET_CUSTOM_ATTRIBUTE", "Mileage");
*/


function getScriptText(scriptCode) {
    var service = com.accela.aa.emse.dom.service.CachedService.getInstance().getEMSEService();
    try {
        var r = service.getScriptByPK(aa.getServiceProviderCode(), scriptCode, "ADMIN");
        return r.getScriptText() + "";
    } catch (i) {
        return "";
    }
}

var SCRIPT_VERSION = 3.0;

var scriptStatus = "";
var scriptDate = "2018.09.24 00:33";

eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));
//TEMP eval(getScriptText("INCLUDE_ASSET"));   // now included in this script
logDebug = function (x) {
    aa.print("DEBUG:" + x);
}
//--------------------------------------------------------------------------------------------
// INCLUDE_ASSET BEGIN
//--------------------------------------------------------------------------------------------
function Asset(id) {
    if (id == null || id == "") {
        throw "ID cannot be null or empty"
    }
    this.service = com.accela.aa.emse.dom.service.CachedService.getInstance().getAssetDataService();
    var assetSequenceNumber = null;
    if (id.getClass && id.getClass().getName() == "AssetMasterPK") {
        assetSequenceNumber = id.getG1AssetSequenceNumber();
    } else {
        var assets = this.service.getAssetDataByID(aa.getServiceProviderCode(), id, aa.util.newQueryFormat());

        if (assets != null) {
            assets = assets.toArray();
            if (assets.length == 0) {
                throw "Asset with ID " + id + " does not exist";
            }
            assetSequenceNumber = assets[0].getAssetMaster().getG1AssetSequenceNumber();
        }
    }

    var assetResp = aa.asset.getAssetData(String(assetSequenceNumber));
    if (!assetResp.getSuccess()) {
        throw assetResp.getErrorMessage();
    }
    if (assetResp.getOutput() == null) {
        throw "Asset with Seq " + assetSequenceNumber + " does not exist";
    }
    this.assetModel = assetResp.getOutput().getAssetDataModel();
    this.dataAttributes = {};
    var dataAttributes = this.assetModel.getDataAttributes();
    for (var i = 0; i < dataAttributes.size(); i++) {
        var dataAttributeModel = dataAttributes.get(i);
        this.dataAttributes[dataAttributeModel.getG1AttributeName()] = dataAttributeModel;
    }
}

/**
 * get the description of this asset
 * 
 * @returns {String}
 */
Asset.prototype.getDescription = function () {
    return this.assetModel.getAssetMaster().getDispG1Description();
}

/**
 * get the group of this asset
 * 
 * @returns {String}
 */
Asset.prototype.getGroup = function () {
    return this.assetModel.getAssetMaster().getG1AssetGroup();
}

/**
 * get the type of this asset
 * 
 * @returns {String}
 */
Asset.prototype.getType = function () {
    return this.assetModel.getAssetMaster().getG1AssetType();
}

/**
 * get the ID of this asset
 * 
 * @returns {String}
 */
Asset.prototype.getID = function () {
    return this.assetModel.getAssetMaster().getG1AssetID();
}
/**
 * get the sequence number of this asset
 * 
 * @returns {Number}
 */
Asset.prototype.getSequenceNumber = function () {
    return this.assetModel.getAssetMaster().getG1AssetSequenceNumber();
}

/**
 * get the primary key of this asset
 * 
 * @returns com.accela.ams.asset.AssetMasterPK
 */
Asset.prototype.getAssetPK = function () {
    return this.assetModel.getAssetMaster().getAssetPK();
}

/**
 * return the last usage reading value for a unit
 * 
 * @param unit
 *            the unit
 * @returns {Number} the
 */
Asset.prototype.getLastUsageReading = function (unit) {
    if (this.usageBiz == null) {
        this.usageBiz = com.accela.util.AVContext.getBean(java.lang.Class.forName("com.accela.ams.asset.AssetUsageTrackService"));
    }

    var usage = 0;
	//var pk = this.getAssetPK();
    var lastUsage = this.usageBiz.getLastUsage(this.getAssetPK(), unit);
    if (lastUsage != null) {
        usage = lastUsage.getUsageReading();
    }
	//var assetSequenceNbr = String.valueOf(this.getAssetPK().getG1AssetSequenceNumber());
	var assetSequenceNbr = this.getAssetPK().getG1AssetSequenceNumber();
	logDebug("getLastUsageReading(): G1AssetSequenceNumber:[" + assetSequenceNbr + "], unit:[" + unit + "], usage:[ " + usage + "]");
	scriptStatus = scriptStatus + "| getLastUsageReading(): G1AssetSequenceNumber:[" + assetSequenceNbr + "], unit:[" + unit + "], usage:[ " + usage + "]";
    return usage;

}

/**
 * create a usage for this asset
 * 
 * @param lastUsageReading
 *            last reading value, number
 * @param newUsageReading
 *            current reading value, number
 * @param readingDate
 *            the date of the reading. If null then will default to current date
 * @param unit
 *            the unit of the reading 
 * @param comments
 *            comments of the reading
 * @returns {Number} reading difference 
 */
Asset.prototype.createUsage = function (newUsageReading, readingDifference, unit, readingDate, comments) {
    if (this.usageBiz == null) {
        this.usageBiz = com.accela.util.AVContext.getBean(java.lang.Class.forName("com.accela.ams.asset.AssetUsageTrackService"));
    }
    var assetUsage = new com.accela.ams.asset.AssetUsageTrackModel();

    assetUsage.setServProvCode(aa.getServiceProviderCode());
    assetUsage.setUsageReading(Number(newUsageReading));
    if (readingDifference != null)
        assetUsage.setReadingDifference(readingDifference);

    assetUsage.setUsageUnitType(unit);

    if (readingDate == null) {
        logDebug("==> createUsage(): assetUsage.setReadingDate(aa.util.now())");
		scriptStatus = scriptStatus + "| createUsage(): setReadingDate(now).";
        assetUsage.setReadingDate(aa.util.now());
    }
    else {
        var readingDateConverted = convertDateX(readingDate);
        logDebug("createUsage(): readingDateConverted:" + readingDateConverted);
		scriptStatus = scriptStatus + "| createUsage(): setReadingDate(readingDateConverted).";
        assetUsage.setReadingDate(readingDateConverted);
    }

    assetUsage.setGeneratedWO("N");
    assetUsage.setComments(comments);
    assetUsage.setRecordDate(aa.util.now());
    assetUsage.setRecordStatus("A");
    var reader = aa.person.getCurrentUser().getOutput();
    assetUsage.setReadingByFname(reader.getFirstName());
    assetUsage.setReadingByMname(reader.getMiddleName());
    assetUsage.setReadingByLname(reader.getLastName());
    assetUsage.setRecordFullName(reader.getUserID());
    assetUsage.setReadingByUserID(reader.getUserID());
    assetUsage.setReadingByFullDept(reader.getDeptOfUser());
    assetUsage.setAssetID(this.getSequenceNumber());
	
    logDebug("createUsage(): this.usageBiz.createAssetUsageTrack...");
	scriptStatus = scriptStatus + "| createUsage(): createAssetUsageTrack.";
    var result = this.usageBiz.createAssetUsageTrack(assetUsage);
    return result;
}

/**
 * return attribute value for this asset
 * 
 * @param name
 *            the attribute name
 * @returns {String}
 */
Asset.prototype.getASI = function (name) {
    var ret = null;

    var dataAttributeModel = this.dataAttributes[name];
    if (dataAttributeModel) {
        ret = dataAttributeModel.getG1AttributeValue();
    }
    return ret;
}
/**
 * update an attribute value
 * 
 * @param name
 *            the name
 * @param value
 *            the value to set
 * @param bsave
 *            boolean, true to save to db
 */
Asset.prototype.updateASI = function (name, value, bsave) {

    var dataAttributeModel = this.dataAttributes[name];

    if (!dataAttributeModel) {
        logDebug("custom attribute '" + name + "' is null.  Dynamically adding to attribute list.");
        dataAttributeModel = new com.accela.ams.asset.DataAttributeModel()
        dataAttributeModel.setServiceProviderCode(aa.getServiceProviderCode());
        dataAttributeModel.setG1AssetSequenceNumber(this.getSequenceNumber());
        dataAttributeModel.setG1AttributeName(name);
        dataAttributeModel.setRecStatus("A");
        dataAttributeModel.setRecFulNam(aa.getAuditID());
        dataAttributeModel.setRecDate(new Date());
        this.dataAttributes[name] = dataAttributeModel;
    }
    dataAttributeModel.setG1AttributeValue(value);
    if (bsave) {
        this.save()
    }

}
/**
 * save asset to db
 */
Asset.prototype.save = function () {
    var atts = aa.util.newArrayList();
    for (var x in this.dataAttributes) {
        atts.add(this.dataAttributes[x])
    }
    this.assetModel.setDataAttributes(atts)
    var assetResp = aa.asset.editAsset(this.assetModel)
    if (!assetResp.getSuccess()) {
        throw assetResp.getErrorMessage();
    }
}

//--------------------------------------------------------------------------------------------
// INCLUDE_ASSET END
//--------------------------------------------------------------------------------------------

// copied from INCLUDES_ACCELA_FUNCTIONS
function convertDateX(thisDate) {
    if (typeof (thisDate) == "string") {
        logDebug("convertDateX. format=string");
        var retVal = new Date(String(thisDate));
        if (!retVal.toString().equals("Invalid Date")) {
            logDebug("convertDateX. 'Invalid Date'");	
            return retVal;
        }
    }

    if (typeof (thisDate) == "object") {
        //logDebug("convertDateX. format=object");	

        if (!thisDate.getClass) // object without getClass, assume that this is a javascript date already
        {
            return thisDate;
        }

        if (thisDate.getClass().toString().equals("class com.accela.aa.emse.util.ScriptDateTime")) {
            return new Date(thisDate.getMonth() + "/" + thisDate.getDayOfMonth() + "/" + thisDate.getYear());
        }

        if (thisDate.getClass().toString().equals("class java.util.Date")) {
            return new Date(thisDate.getTime());
        }

        if (thisDate.getClass().toString().equals("class java.lang.String")) {
            return new Date(String(thisDate));
        }
    }

    if (typeof (thisDate) == "number") {
        logDebug("convertDateX. format=number");	
        return new Date(thisDate);  // assume milliseconds
    }

    logDebug("**WARNING** convertDateX(): convertDate cannot parse date : " + thisDate);
    return null;

}


/*
    add a new usage record for Fleet Vehicle/Equipment PM, WO monitoring/triggers
*/

Asset.prototype.addAssetFleetUsage = function (newReading, readingDate, comment, customAttributeField) {
    var asset = this;
    var result = 0;
    if (asset.getGroup() == "Fleet") {
        var assetType = asset.getType();
        var unit = null;
        if (assetType == "Vehicle") {
            unit = "miles";
        } else if (assetType == "Equipment") {
            unit = "hours";
        }

        var lastReading = asset.getLastUsageReading(unit);
        logDebug("addAssetFleetUsage(): lastReading=" + lastReading + " " + unit);

        if (newReading > lastReading) {
            logDebug("addAssetFleetUsage(): creating usage because input " + unit + " value [" + newReading + "] is greater than last reading[" + lastReading + "]");

            var readingDiff = Number(newReading) - lastReading;
            logDebug("addAssetFleetUsage(): readingDiff: " + readingDiff);

            // add usage child record
            result = asset.createUsage(newReading, readingDiff, unit, readingDate, comment);

            //update the asset attribute on the asset record
            try {
                asset.updateASI(customAttributeField, newReading, true)
                logDebug("addAssetFleetUsage(): custom attribute updated");
				scriptStatus = scriptStatus + "| addAssetFleetUsage(): custom attribute updated.";

            }
            catch (e) {
                logDebug("addAssetFleetUsage(): Error attempting to update custom attribute:" + customAttributeField)
                logDebug("addAssetFleetUsage(): ERROR Details:" + e)
				scriptStatus = scriptStatus + "| addAssetFleetUsage(): Error attempting to update custom attribute:" + customAttributeField;
            }

        } else if (newReading < lastReading) {
            logDebug("addAssetFleetUsage(): new " + unit + " is less than  [" + lastReading + "].  Do nothing.");
			scriptStatus = scriptStatus + "| addAssetFleetUsage(): new " + unit + " is less than  [" + lastReading + "].  Do nothing..";
        } else {
            logDebug("addAssetFleetUsage(): Usage  " + unit + " and last reading are already synchronized. Do Nothing");
			scriptStatus = scriptStatus + "| addAssetFleetUsage(): Usage  " + unit + " and last reading are already synchronized. Do Nothing";
        }

    }
    //returns reading difference
    return result;
}
//----------------------------------------------------------------------------------------------


//----------------------------------------------------------------------------------------------
/*
    add a new usage record for FuelTypes and Fuel Quantity tracking
*/
Asset.prototype.addAssetFuelUsage = function (fuelQty, readingDate, unit, comment) {
    var asset = this;
    var result = 0;
    if (unit == null)
        unit = "Unknown-Fuel";

    if (asset.getGroup() == "Fleet") {
        var assetType = asset.getType();
        logDebug("addAssetFuelUsage(): creating usage fuel type: " + unit + ", qty:" + fuelQty);
		scriptStatus = scriptStatus + "| addAssetFuelUsage(): creating usage fuel type: " + unit + ", qty:" + fuelQty;
        //fuel qty, diff, 'Unleaded Regular', readingDate, 'fuel type'
        result = asset.createUsage(fuelQty, 0, unit, readingDate, comment);

    }
    return result;
}

//------------------------------------ start ------------------------------------

try {

	logDebug("Script date: " + scriptDate);
    var assetID = aa.env.getValue("ASSET_ID");
    var newReading = aa.env.getValue("USAGE_AMOUNT");
    var readingDate = aa.env.getValue("USAGE_DATE");
    var fuelType = aa.env.getValue("FUEL_TYPE");
    var fuelQuantity = aa.env.getValue("FUEL_QUANTITY");
    var comment = aa.env.getValue("COMMENT");
    var assetCustomAttributeName = aa.env.getValue("ASSET_CUSTOM_ATTRIBUTE");
    /*    
        logDebug("input ASSET_ID: " + assetID);
        logDebug("input USAGE_AMOUNT: " + newReading);
        logDebug("input USAGE_DATE: " + readingDate);
        logDebug("input FUEL_TYPE: " + fuelType);
        logDebug("input FUEL_QUANTITY: " + fuelQuantity);
        logDebug("input COMMENT: " + comment);
        logDebug("input ASSET_CUSTOM_ATTRIBUTE: " + assetCustomAttributeName);
    */

    //create usage record for miles or hours. And update custom attribute field on asset record
    var assetFleet = new Asset(assetID);
    var fleetUsageDiff;
    var fuelQtyResult;
    if (assetFleet == null) {
        aa.env.setValue("SUCCESS", false);
        logDebug("could not find that Asset ID!");
		scriptStatus = scriptStatus + "| could not find that Asset ID!";

		}
    else {
        logDebug("main: Found Asset ID!");
        if (comment == null)
            comment = "";

        fleetUsageDiff = assetFleet.addAssetFleetUsage(newReading, readingDate, comment.toString(), assetCustomAttributeName);
        logDebug("main: call addAssetFuelUsage");
        fuelQryResult = assetFleet.addAssetFuelUsage(fuelQuantity, readingDate, fuelType, comment.toString());

        aa.env.setValue("SUCCESS", true);
		aa.env.setValue("STATUS",scriptStatus);
    }

} catch (e) {
    aa.env.setValue("SUCCESS", false);
    logDebug("ERROR:" + e)
	aa.env.setValue("STATUS",scriptStatus);
    aa.env.setValue("ERROR", e + "");

}