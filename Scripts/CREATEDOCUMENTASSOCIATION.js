//Create association like Look Up for Standard source document. Entity_Type refers to table BDOCUMENT.var refContactId = "239872";var capID = "14CAP-00000-002SH"var refContactDocResult = aa.document.getDocumentListByEntity(refContactId , "LICENSEPROFESSIONAL");if(refContactDocResult.getSuccess()){    var refDocList = refContactDocResult.getOutput();       if(refDocList.size() > 0)  {     for(index = 0; index < refDocList.size(); index++)     {               var documentModel = refDocList.get(index);            documentModel.setUserName("testuser1");          documentModel.setPassword("Password123");			   aa.document.createDocumentAssociation(documentModel, capID, "CAP");                        aa.print("success!");           }  }}else{  aa.print("Get reference contact document failure!");}//Create association like Look Up for Accela/ADS source document. Entity_Type refers to table BDOCUMENT.var refContactId = "61046";var capID = "14CAP-00000-002SH"var refContactDocResult = aa.document.getDocumentListByEntity(refContactId , "REFCONTACT");if(refContactDocResult.getSuccess()){  var refDocList = refContactDocResult.getOutput();  if(refDocList.size() > 0)  {     for(index = 0; index < refDocList.size(); index++)     {                aa.document.createDocumentAssociation(refDocList.get(index), capID, "CAP");                          aa.print("success!");           }  }}else{  aa.print("Get reference contact document failure!");}//Add to People for Accela/ADS source documentvar refProfessionalId = "239872";var capID = "14CAP-00000-002SH";var capDocResult = aa.document.getDocumentListByEntity(capID,"CAP");if(capDocResult.getSuccess()){  if(capDocResult.getOutput().size() > 0)  {     for(index = 0; index < capDocResult.getOutput().size(); index++)     {          aa.document.createDocumentAssociation(capDocResult.getOutput().get(index), refProfessionalId, "LICENSEPROFESSIONAL");                     aa.print("success!");           }  }}else{  aa.print("Get reference contact document failure!");}//Add to People for Standard source documentvar refProfessionalId = "61046";var capID = "14CAP-00000-002SH";var capDocResult = aa.document.getDocumentListByEntity(capID,"CAP");if(capDocResult.getSuccess()){  if(capDocResult.getOutput().size() > 0)  {     for(index = 0; index < capDocResult.getOutput().size(); index++)     {          var documentModel = capDocResult.get(index);            documentModel.setUserName("testuser1");          documentModel.setPassword("Password123");		  aa.document.createDocumentAssociation(documentModel, refProfessionalId, "REFCONTACT");          aa.print("success!");           }  }}else{  aa.print("Get reference contact document failure!");}