var GENERAL_DB =
  "https://docs.google.com/spreadsheets/d/1108Pbaw4SD_Cpx2xc6Q7x1UvrET0SsPgNNZOPumt9Gg/edit#gid=0";

var SELECTED_PERSON = { data: null, type: null, isApproved: false, row: null };
function onSpreadSheetEdit(e) {
  var range = e.range;
  checkEditedCell(range);
}

function checkEditedCell(range) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var sheetValues = sheet.getSheetValues(
    range.getRow(),
    1,
    1,
    sheet.getLastColumn()
  );
  var rawPerson = sheetValues[0];
  rawPerson = rawPerson.map(function (value) {
    return value.toString();
  });
  SELECTED_PERSON.row = range.getRow();
  SELECTED_PERSON.data = {
    cedula: rawPerson[2],
    nombre: rawPerson[0] + " " + rawPerson[1],
    email: rawPerson[3],
    pago_total: rawPerson[6],
    concepto_pago: rawPerson[5],
    dependecia: "COGESTEC 2019",
    telefono: rawPerson[4]
  };
  if (range.getColumn() == 8) {
    handleOnPaymentChange(range);
  } else if (range.getColumn() == 12) {
    handleOnDocumentChange(range);
  }
}

function handleOnPaymentChange(range) {
  SELECTED_PERSON.type = "PAY";
  if (range.getValue() == "SI") {
    if (SELECTED_PERSON.data.concepto_pago.indexOf("Researcher") !== -1) {
      sendResearcherPayApprovedMail();
    } else if (SELECTED_PERSON.data.concepto_pago.indexOf("Attendant") !== -1) {
      sendAttendantPayApprovedMail();
    }
  } else if (range.getValue() == "NO") {
    sendPayDisapprovedMail();
  }
}

function handleOnDocumentChange(range) {
  SELECTED_PERSON.type = "DOC";
  if (range.getValue() == "SI") {
    sendDocApprovedMail();
  } else if (range.getValue() == "NO") {
    sendDocDisapprovedMail();
  }
}
function getSheetFromSpreadSheet(url, sheet) {
  var Spreedsheet = SpreadsheetApp.openByUrl(url);
  if (url && sheet) return Spreedsheet.getSheetByName(sheet);
}

function refuseStudentDisccount() {
  var index = SELECTED_PERSON.row;
  var inscritosSheet = getSheetFromSpreadSheet(GENERAL_DB, "INSCRITOS");
  var headers = inscritosSheet.getSheetValues(
    1,
    1,
    1,
    inscritosSheet.getLastColumn()
  )[0];
  var pagoIndex = headers.indexOf("PAGO_TOTAL");
  if (SELECTED_PERSON.data.concepto_pago.indexOf("Researcher") !== -1) {
    inscritosSheet.getRange(index, pagoIndex + 1).setValues([["$437.000"]]);
  } else if (SELECTED_PERSON.data.concepto_pago.indexOf("Student") !== -1) {
    inscritosSheet.getRange(index, pagoIndex + 1).setValues([["$322.000"]]);
  }
  var htmlBody = buildDocDisapprovedBody();
  var subject = "Solicitud de descuento COGESTEC Denegada.";
  sendEmail(subject, htmlBody);
}

function sendDocApprovedMail() {
  var htmlBody = buildDocApprovedBody();
  var subject = "Solicitud de descuento COGESTEC Aceptado.";
  sendEmail(subject, htmlBody);
}

function sendDocDisapprovedMail() {
  refuseStudentDisccount();

}

function sendAttendantPayApprovedMail() {
  var htmlBody = buildAttendantPayApprovedBody();
  var subject = "Confirmación de pago Asistente";
  sendEmail(subject, htmlBody);
}

function sendResearcherPayApprovedMail() {
  var htmlBody = buildResearcherPayApprovedBody();
  var subject = "Confirmación de pago Ponente";
  sendEmail(subject, htmlBody);
}

function sendPayDisapprovedMail() { }
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

function getPersonQR() {
  var qrserver = "http://api.qrserver.com/v1/create-qr-code/";
  var qrimage =
    "" +
    '<img src="' +
    qrserver +
    "?color=000000&amp;bgcolor=FFFFFF&amp;" +
    "data=" +
    SELECTED_PERSON.data.cedula +
    '&amp;qzone=1&amp;margin=0&amp;size=400x400&amp;ecc=L" alt="qr code" />';
  return qrimage;
}

function buildResearcherPayApprovedBody() {
  var body = "";
  var successMsg =
    "<p>Cordial saludo " +
    SELECTED_PERSON.data.nombre +
    ", bienvenido a COGESTEC 2019 el evento más innovador de Colombia, en este email adjuntaremos un código QR, por favor, " +
    "preséntarlo en el ingreso al evento académico para que hagas el ingreso en las sedes del evento.</p>" +
    "<p>Recuerda que obtendrás certificado como ponente por presentar tu ponencia en la fecha y hora asignadas y como asistente al evento, al pasar por la mesa de registro el día del evento.</p>" +
    '<p>Recuerda que siempre podrás consultar la agenda en el siguiente enlace: <a href="http://www.cogestec.co/agenda/">http://www.cogestec.co/agenda/</a></p>' +
    '<p>La información de interés para ponentes se encuentra en el siguiente enlace: <a href="http://www.cogestec.co/ponentes/">http://www.cogestec.co/ponentes/</a></p>' +
    "<p>Te agradecemos por hacer parte de la historia de la innovación en Colombia, esperamos conozcas personas y empresas interesadas en la innovación como tú, de la que puedan construir relaciones de mutuo beneficio.</p>" +
    "<p>COGESTEC 2019 te desea un excelente día.</p>";
  body = successMsg;
  var qr = getPersonQR();
  body = body.concat(qr);
  body = body.concat(
    '<img src="https://drive.google.com/uc?id=1hyYzvSH1SyXmVLEtxlHvM6WX_vDs8T8H"/>'
  );
  return body;
}

function buildAttendantPayApprovedBody() {
  var body = "";
  var successMsg =
    "<p>Cordial saludo " +
    SELECTED_PERSON.data.nombre +
    ", bienvenido a COGESTEC 2019 el evento más innovador de Colombia," +
    " en este email adjuntaremos un código QR, por favor, preséntarlo en el ingreso al evento académico para que hagas el ingreso en las sedes del evento.</p>" +
    "<br/>Podrás consultar la agenda en el siguiente enlace: http://www.cogestec.co/agenda/" +
    "<p>Recuerda que obtendrás certificado al pasar por las mesas de registro del evento académico.</p>";
  body = successMsg;
  var qr = getPersonQR();
  body = body.concat(qr);
  body = body.concat(
    '<img src="https://drive.google.com/uc?id=1hyYzvSH1SyXmVLEtxlHvM6WX_vDs8T8H"/>'
  );
  return body;
}

function buildDocDisapprovedBody() {
  var body = "";
  var successMsg =
    "<p>Cordial saludo " +
    SELECTED_PERSON.data.nombre +
    ", lamentamos informar que tu solicitud de descuento ha sido denegada puesto que," +
    "la información adjunta es insuficiente para comprobar tu estado actual como estudiante de pregrado activo.</p>" +
    "<p>No te preocupes, aún puedes participar como asistente.</p>";
  var modal = buildModal(successMsg);
  body = body.concat(modal);
  return body;
}

function buildDocApprovedBody() {
  var body = "";
  var successMsg =
    "<p>Cordial saludo " +
    SELECTED_PERSON.data.nombre +
    ", ha sido aprobada tu solicitud de descuento, felicitaciones.</p>" +
    "<p>A continuación la información que deberás copiar en el formulario de pago.</p>";
  var modal = buildModal(successMsg);
  body = body.concat(modal);
  return body;
}

function buildModal(successMsg) {
  var modal =
    '<div class="content">' +
    '<div id="result-msg" class="ui message">' +
    successMsg +
    "</div>" +
    '<form class="ui form not-visible" id="modal-form">' +
    '<div id="pay_info_modal" ' +
    'class="ui medium center aligned inverted header">' +
    '<i class="icon lock"></i>' +
    "<strong>INFORMACIÓN DE PAGO</strong><br/>" +
    "</div>" +
    '<div class="inline field">' +
    "<strong>*NIT o Cédula:  </strong>" +
    "<label>" +
    SELECTED_PERSON.data.cedula +
    "</label>" +
    "</div>" +
    '<div class="inline field">' +
    "<strong>*Concepto de Pago:  </strong>" +
    "<label>" +
    SELECTED_PERSON.data.concepto_pago +
    "</label>" +
    "</div>" +
    '<div class="inline field">' +
    "<strong>*Pago Total:  </strong>" +
    "<label>" +
    SELECTED_PERSON.data.pago_total +
    "(pesos colombianos)" +
    " </label>" +
    "</div>" +
    '<div class="inline field">' +
    "<strong>*Nombre Completo:  </strong>" +
    "<label>" +
    SELECTED_PERSON.data.nombre +
    " </label>" +
    "</div>" +
    '<div class="inline field">' +
    "<strong>*Dependencia:  </strong>" +
    "<label>" +
    SELECTED_PERSON.data.dependecia +
    "</label>" +
    "</div>" +
    '<div class="inline field">' +
    "<strong>Télefono de Contacto:  </strong>" +
    "<label>" +
    SELECTED_PERSON.data.telefono +
    " </label>" +
    "</div>" +
    "<br />" +
    '<div class="actions">' +
    '<button style="color:red">' +
    '<a href="https://www.psepagos.co/PSEHostingUI/ShowTicketOffice.aspx?ID=4111">' +
    "<h2>Generar pago</h2>" +
    "</a></button>" +
    "</div>" +
    "</form>" +
    "</div>";

  return modal;
}
