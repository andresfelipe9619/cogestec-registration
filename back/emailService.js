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
  rawPerson = rawPerson.map(function(value) {
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
  } else if (range.getColumn() == 13) {
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
    } else if (SELECTED_PERSON.data.concepto_pago.indexOf("Student") !== -1) {
      sendAttendantPayApprovedMail();
    }
  } else if (range.getValue() == "NO") {
    sendPayDisapprovedMail();
  }
}

function handleOnDocumentChange(range) {
  Logger.log("doc change");
  Logger.log(range);
  SELECTED_PERSON.type = "DOC";
  if (range.getValue() == "SI") {
    Logger.log("doc change si");

    sendDocApprovedMail();
  } else if (range.getValue() == "NO") {
    Logger.log("doc change no");
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
  var conceptoIndex = headers.indexOf("CONCEPTO_PAGO");

  if (SELECTED_PERSON.data.concepto_pago.indexOf("Researcher") !== -1) {
    inscritosSheet.getRange(index, pagoIndex + 1).setValues([["$322.000"]]);
    inscritosSheet
      .getRange(index, conceptoIndex + 1)
      .setValues([["Professional Researcher"]]);
    SELECTED_PERSON.data.concepto_pago = "Professional Researcher";
    SELECTED_PERSON.data.pago_total = "$322.000";
  } else if (SELECTED_PERSON.data.concepto_pago.indexOf("Student") !== -1) {
    inscritosSheet.getRange(index, pagoIndex + 1).setValues([["$437.000"]]);
    inscritosSheet
      .getRange(index, conceptoIndex + 1)
      .setValues([["Professional"]]);
    SELECTED_PERSON.data.concepto_pago = "Professional";
    SELECTED_PERSON.data.pago_total = "$437.000";
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

function sendPayDisapprovedMail() {}

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
    " " +
    "<strong>Su ID digital está aquí:</strong><br/>" +
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
  var successMsg = getSuccessMessage();
  var complement =
    '<p>La información de interés para ponentes se encuentra en el siguiente enlace: <a href="http://www.cogestec.co/ponentes/">http://www.cogestec.co/ponentes/</a></p>' +
    "<p>Te agradecemos por hacer parte de la historia de la innovación en Colombia, esperamos conozcas personas y empresas interesadas en la innovación como tú, de la que puedan construir relaciones de mutuo beneficio.</p>" +
    "<p>COGESTEC 2019 te desea un excelente día.</p>";
  successMsg = successMsg.concat(complement);
  successMsg = successMsg.concat(getLogo());
  body = successMsg;
  var qr = getPersonQR();
  body = body.concat(qr);
  body = body.concat(getBanner());
  return body;
}

function buildAttendantPayApprovedBody() {
  var body = "";
  var successMsg = getSuccessMessage();
  successMsg = successMsg.concat(getLogo());
  body = successMsg;
  var qr = getPersonQR();
  body = body.concat(qr);
  body = body.concat(getBanner());
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

function getSuccessMessage() {
  return (
    "<p>Cordial saludo " +
    SELECTED_PERSON.data.nombre +
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
    '<a href="http://www.cogestec.co/agenda/"><img src="https://drive.google.com/uc?id=1hyYzvSH1SyXmVLEtxlHvM6WX_vDs8T8H"/></a>'
  );
}
