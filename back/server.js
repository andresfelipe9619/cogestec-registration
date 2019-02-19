var ROOT_FOLDER = "COGESTEC";
var REQUEST_PAYLOAD = null;
var GENERAL_DB =
  "https://docs.google.com/spreadsheets/d/1108Pbaw4SD_Cpx2xc6Q7x1UvrET0SsPgNNZOPumt9Gg/edit#gid=0";

function doGet(request) {
  var isAdmin = validateUserSession();
  var isAttendant = readRequestParameter(request);
  if (isAdmin && isAttendant) {
    return createHtmlTemplate("index.html");
  } else if (isAttendant) {
    return createHtmlTemplate("index.html");
  } else return createHtmlTemplate("close.html");
}

function doPost(request) {
  Logger.log("request");
  Logger.log(request);

  if (typeof request != "undefined") {
    Logger.log(request);
    var params = request.parameter;
    Logger.log("params");
    Logger.log(params);
    return ContentService.createTextOutput(JSON.stringify(request.parameter));
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

function readRequestParameter(request) {
  var validQueries = ["student", "student_r", "professional", "professional_r"];
  if (typeof request !== "undefined") {
    var params = request.parameter;
    Logger.log(params.attendant);
    if (validQueries.indexOf(params.attendant) > -1) {
      return true;
    }
    return false;
  }
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
  person.push({
    name: "hora_registro",
    value: new Date().toLocaleDateString()
  });
  var payIndex = -1;
  for (var i in person) {
    if (person[i] && person[i]["name"] === "pay_file") {
      payIndex = i;
    }
  }

  if (
    payIndex === -1 ||
    (payIndex !== -1 && !person[payIndex].value.length > 3)
  ) {
    person.push({ name: "pay_file", value: "-" });
  }
  person.push({ name: "pago_comprobado", value: "-" });

  logFunctionOutput("person", person);

  var personValues = objectToSheetValues(person, headers);
  var finalValues = personValues.map(function(value) {
    return String(value);
  });
  var nicePerson = {
    cedula: personValues[2],
    nombres: personValues[0],
    apellidos: personValues[1],
    email: personValues[3],
    pago_total: personValues[8],
    concepto_pago: personValues[7],
    dependecia: "COGESTEC 2019",
    telefono: personValues[4]
  };
  inscritosSheet.appendRow(finalValues);
  var result = { data: nicePerson, ok: true };
  logFunctionOutput(registerPerson.name, result);

  return result;
}

function changePonencia(index, value) {
  var inscritosSheet = getSheetFromSpreadSheet(GENERAL_DB, "INSCRITOS");
  var headers = inscritosSheet.getSheetValues(
    1,
    1,
    1,
    inscritosSheet.getLastColumn()
  )[0];
  var pagoIndex = headers.indexOf("ACEPTA_PONENCIA");
  Logger.log(pagoIndex);
  Logger.log(index);
  logFunctionOutput(
    generatePayment.name,
    inscritosSheet.getRange(index, pagoIndex).getValues()
  );
  inscritosSheet.getRange(index + 1, pagoIndex + 1).setValues([[value]]);
  return true;
}

function validatePerson(cedula) {
  var inscritos = getPeopleRegistered();
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

  if (result.index < 0) {
    result.isRegistered = false;
  }
  return JSON.stringify(result);
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
function createPersonFile(name, numdoc, data) {
  var result = {
    url: "",
    file: ""
  };
  var mainFolder = getMainFolder();
  var currentFolder = getPersonFolder(numdoc, mainFolder);

  var contentType = data.substring(5, data.indexOf(";")),
    bytes = Utilities.base64Decode(data.substr(data.indexOf("base64,") + 7)),
    blob = Utilities.newBlob(bytes, contentType, file);

  var file = currentFolder.createFile(blob);
  file.setDescription("Subido Por " + numdoc);
  file.setName(numdoc + "_" + name);
  result.url = file.getUrl();
  result.file = file.getName();
  return result;
}

function createPersonFolder(numdoc, data) {
  var res = createPersonFile("DOCUMENTO", numdoc, data);
  return res;
}

function createPaymentFile(numdoc, data) {
  var res = createPersonFile("PAY", numdoc, data);
  return res;
}
function generatePayment(index, numdoc, file) {
  var inscritosSheet = getSheetFromSpreadSheet(GENERAL_DB, "INSCRITOS");
  var headers = inscritosSheet.getSheetValues(
    1,
    1,
    1,
    inscritosSheet.getLastColumn()
  )[0];
  var pagoIndex = headers.indexOf("PAY_FILE");
  var mfile = createPaymentFile(numdoc, file);
  // logFunctionOutput(generatePayment.name, inscritosSheet.getRange(index, pagoIndex).getValues())
  inscritosSheet.getRange(index + 1, pagoIndex + 1).setValues([[mfile.url]]);
  return true;
}

function createPonenciaFile(numdoc, data) {
  var res = createPersonFile("PONENCIA", numdoc, data);
  return res;
}

function sendInternationalMail() {
  var htmlBody = buildInternationalBody();
  var subject = "Confirmación de pago Ponente";
  sendEmail(subject, htmlBody);
}

function sendEmail(subject, body) {
  Logger.log("I like the way you french inhale");
  Logger.log(body);
  if (SELECTED_PERSON.data) {
    MailApp.sendEmail({
      to: SELECTED_PERSON.data.email,
      subject: subject,
      name: "COGESTEC 2019",
      htmlBody: body
      // attachments: [],
    });
  }
}
function buildInternationalBody() {
  var body = "";
  var successMsg = getSuccessMessage();
  // var complement =
  //   '<p>La información de interés para ponentes se encuentra en el siguiente enlace: <a href="http://www.cogestec.co/ponentes/">http://www.cogestec.co/ponentes/</a></p>' +
  //   "<p>Te agradecemos por hacer parte de la historia de la innovación en Colombia, esperamos conozcas personas y empresas interesadas en la innovación como tú, de la que puedan construir relaciones de mutuo beneficio.</p>" +
  //   "<p>COGESTEC 2019 te desea un excelente día.</p>";
  // successMsg = successMsg.concat(complement);
  successMsg = successMsg.concat(getLogo());
  body = successMsg;
  var qr = getPersonQR();
  body = body.concat(qr);
  body = body.concat(getBanner());
  return body;
}

function getSuccessMessage(person) {
  return (
    "<p>Cordial saludo " +
    person.data.nombre +
    " " +
    person.data.apellidos +
    ", bienvenido a COGESTEC 2019 el evento más innovador de Colombia," +
    "eres un invitado especial a este evento exclusivo donde conocerás métodos y estudios relacionados al emprendimiento, estrategias y técnicas para transformar tu visión; " +
    "así mismo, investigaciones académicas sobre los impactos que tendrá la tecnología en el mundo moderno." +
    '<br/> En este email adjuntaremos un código QR, por favor, preséntarlo en las <span style="text-decoration: underline"> mesas de registro</span> al ingreso del evento, allí le entregarán su escarapela de ingreso,' +
    'requerida para ingresar a las conferencias y otros servicios del evento, de igual manera es <span style="text-decoration: underline">la única forma </span> de obtener su certificado como ponente/asistente.</p>'
  );
}
function getLogo() {
  return (
    "<strong>Haga clic en el logo para conocer la agenda:</strong><br/>" +
    '<a href="http://www.cogestec.co/agenda/"><img src="http://www.cogestec.co/wp-content/uploads/2018/11/Logo-3.png" ' +
    'width = "180px" height = "90px" /></a><br/>'
  );
}
function getBanner() {
  return (
    "<br/><strong>¡Sigue nuestras redes sociales y comunica tu vínculo directo con la innovación</strong><br/>" +
    '<a href="http://www.cogestec.co/agenda/"><img src="https://drive.google.com/uc?id=1W0p2HZt_NfV0bvkA12iMSwQh-K2aOizD"/></a>'
  );
}
function getPersonQR(person) {
  var qrserver = "http://api.qrserver.com/v1/create-qr-code/";
  var qrimage =
    " " +
    "<strong>Su ID digital está aquí:</strong><br/>" +
    '<img src="' +
    qrserver +
    "?color=000000&amp;bgcolor=FFFFFF&amp;" +
    "data=" +
    person.data.cedula +
    '&amp;qzone=1&amp;margin=0&amp;size=400x400&amp;ecc=L" alt="qr code" />';
  return qrimage;
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

function sheetValuesToObject(sheetValues, headers) {
  var headings = headers || sheetValues[0].map(String.toLowerCase);
  if (sheetValues) var people = sheetValues.slice(1);
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
