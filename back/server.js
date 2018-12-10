var ROOT_FOLDER = "COGESTEC";
var REQUEST_PAYLOAD = null;
var GENERAL_DB =
  "https://docs.google.com/spreadsheets/d/1108Pbaw4SD_Cpx2xc6Q7x1UvrET0SsPgNNZOPumt9Gg/edit#gid=0";

function doGet(request) {
  var isAdmin = validateUserSession();
  readRequest(request);

  if (isAdmin) {
    return createHtmlTemplate("index.html");
  } else {
    return createHtmlTemplate("close.html");
  }
}

function validateUserSession() {
  var guess_email = Session.getActiveUser().getEmail();
  if (
    guess_email == "suarez.andres@correounivalle.edu.co" ||
    guess_email == "samuel.ramirez@correounivalle.edu.co"
  ) {
    return true;
  }
  return false;
}

function readRequest(request) {
  if (typeof request !== "undefined") {
    var params = request.parameter;
    Logger.log(params.attendant);
    setAttendantPayment(params.attendant);
  }
}

function setAttendantPayment(attendant) {
  
  var he_pays = 0;
  if (attendant) {
    switch (attendant) {
      case "professional":
        he_pays = 437.0;
        break;
      case "student":
        he_pays = 287.5;
        break;
      case "professional_r":
        he_pays = 322.0;
        break;
      case "student_r":
        he_pays = 230.0;
        break;
      default:
        break;
    }
  }
  Logger.log(attendant)
  Logger.log(he_pays)
  REQUEST_PAYLOAD = he_pays;
}

function createHtmlTemplate(filename) {
  return HtmlService.createTemplateFromFile(filename)
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getPeopleRegistered() {
  var peopleSheet = getRawDataFromSheet(GENERAL_DB, "INSCRITOS");
  var peopleObjects = sheetValuesToObject(peopleSheet);
  // logFunctionOutput(getPeopleRegistered.name, peopleObjects)
  return peopleObjects;
}
function getRequestPayload(){
  return REQUEST_PAYLOAD;
}

function searchPerson(cedula) {
  var person = validatePerson(cedula);
  logFunctionOutput(searchPerson.name, person);
  return person;
}

function registerPerson(person) {
  var inscritosSheet = getSheetFromSpreadSheet(GENERAL_DB, "INSCRITOS");
  var headers = inscritosSheet.getSheetValues(
    1,
    1,
    1,
    inscritosSheet.getLastColumn()
  )[0];
  person.push({ name: "hora_registro", value: new Date() });
  person.push({ name: "pago_comprobado", value: "NO" });

  logFunctionOutput("person", person);

  var personValues = objectToSheetValues(person, headers);
  var finalValues = personValues.map(function(value) {
    return String(value);
  });

  inscritosSheet.appendRow(finalValues);
  var result = { data: finalValues, ok: true };
  logFunctionOutput(registerPerson.name, result);
  return result;
}

function generatePayment(index) {
  var inscritosSheet = getSheetFromSpreadSheet(GENERAL_DB, "INSCRITOS");
  var headers = inscritosSheet.getSheetValues(
    1,
    1,
    1,
    inscritosSheet.getLastColumn()
  )[0];
  var pagoIndex = headers.indexOf("PAGO_GENERADO");
  Logger.log(pagoIndex);
  Logger.log(index);
  logFunctionOutput(
    generatePayment.name,
    inscritosSheet.getRange(index, pagoIndex).getValues()
  );
  inscritosSheet.getRange(index + 1, pagoIndex + 1).setValues([["SI"]]);
  return true;
}

function validatePerson(cedula) {
  var inscritos = getPeopleRegistered();
  // var res = ""
  var result = {
    isRegistered: false,
    index: -1,
    data: null
  };

  for (var person in inscritos) {
    if (String(inscritos[person].cedula) === String(cedula)) {
      result.isRegistered = true;
      result.index = person;
      result.data = inscritos[person];
    }
  }

  logFunctionOutput(validatePerson.name, result);

  if (result.index > -1) {
    return result;
  } else {
    result.isRegistered = false;
    return result;
  }
}

function getPersonFolder(name, mainFolder) {
  //se crea la carpeta que va conener todos los docmuentos
  var nameFolder = "documentos";
  var FolderFiles,
    folders = mainFolder.getFoldersByName(nameFolder);
  if (folders.hasNext()) {
    FolderFiles = folders.next();
  } else {
    FolderFiles = mainFolder.createFolder(nameFolder);
  }

  // se crea la carpeta que va contener los documentos de cada inscrito
  var currentFolder,
    folders = FolderFiles.getFoldersByName(name);
  if (folders.hasNext()) {
    currentFolder = folders.next();
  } else {
    currentFolder = FolderFiles.createFolder(name);
  }

  return currentFolder;
}

function getMainFolder() {
  var dropbox = ROOT_FOLDER;
  var mainFolder,
    folders = DriveApp.getFoldersByName(dropbox);

  if (folders.hasNext()) {
    mainFolder = folders.next();
  } else {
    mainFolder = DriveApp.createFolder(dropbox);
  }
  return mainFolder;
}

function createPersonFolder(numdoc, data) {
  //se crea la carpeta que va contener los arhivos actuales
  var result = {
    url: "",
    file: ""
  };
  var mainFolder = getMainFolder();
  var currentFolder = getPersonFolder(numdoc, mainFolder);
  result.url = currentFolder.getUrl();

  var contentType = data.substring(5, data.indexOf(";")),
    bytes = Utilities.base64Decode(data.substr(data.indexOf("base64,") + 7)),
    blob = Utilities.newBlob(bytes, contentType, file);

  var file = currentFolder.createFile(blob);
  file.setDescription("Subido Por " + numdoc);
  file.setName(numdoc + "_documento");
  result.file = file.getName();
  return result;
}

function getSheetFromSpreadSheet(url, sheet) {
  var Spreedsheet = SpreadsheetApp.openByUrl(url);
  if (url && sheet) return Spreedsheet.getSheetByName(sheet);
}

function getRawDataFromSheet(url, sheet) {
  var mSheet = getSheetFromSpreadSheet(url, sheet);
  if (mSheet)
    return mSheet.getSheetValues(
      1,
      1,
      mSheet.getLastRow(),
      mSheet.getLastColumn()
    );
}

function objectToSheetValues(object, headers) {
  var arrayValues = new Array(headers.length);
  var lowerHeaders = headers.map(function(item) {
    return item.toLowerCase();
  });

  for (var item in object) {
    for (var header in lowerHeaders) {
      if (String(object[item].name) == String(lowerHeaders[header])) {
        if (
          object[item].name == "nombres" ||
          object[item].name == "apellidos"
        ) {
          arrayValues[header] = object[item].value.toUpperCase();
          Logger.log(arrayValues);
        } else {
          arrayValues[header] = object[item].value;
          Logger.log(arrayValues);
        }
      }
    }
  }
  //logFunctionOutput(objectToSheetValues.name, arrayValues)
  return arrayValues;
}

function sheetValuesToObject(sheetValues) {
  var headings = sheetValues[0].map(String.toLowerCase);
  var people = sheetValues.slice(1);
  var peopleWithHeadings = addHeadings(people, headings);

  function addHeadings(people, headings) {
    return people.map(function(personAsArray) {
      var personAsObj = {};

      headings.forEach(function(heading, i) {
        personAsObj[heading] = personAsArray[i];
      });

      return personAsObj;
    });
  }
  // logFunctionOutput(sheetValuesToObject.name, peopleWithHeadings)
  return peopleWithHeadings;
}

function logFunctionOutput(functionName, returnValue) {
  Logger.log("Function-------->" + functionName);
  Logger.log("Value------------>");
  Logger.log(returnValue);
  Logger.log("----------------------------------");
}
