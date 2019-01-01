var SELECTED_PERSON = { data: null, type: null, isApproved: false };
function onSpreadSheetEdit(e) {
  var range = e.range;
  Logger.log(range);
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
  Logger.log(sheetValues);
  var rawPerson = sheetValues[0];
  rawPerson = rawPerson.map(function(value){
    return value.toString();
  })
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
  } else if (range.getColumn() == 10) {
    handleOnDocumentChange(range);
  }
  Logger.log(SELECTED_PERSON);
}

function handleOnPaymentChange(range) {
  SELECTED_PERSON.type = "PAY";
  Logger.log(typeof SELECTED_PERSON.data.concepto_pago);
  Logger.log(SELECTED_PERSON.data.concepto_pago)
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
    sendDosendcApprovedMail();
  } else if (range.getValue() == "NO") {
    sendDocDisapprovedMail();
  }
}

function sendDocApprovedMail() {
  var htmlBody = buildDocApprovedBody();
  var subject = "Solicitud de descuento COGESTEC Aceptado.";
  sendEmail(subject, htmlBody);
}

function sendDocDisapprovedMail() {
  var htmlBody = buildDocDisapprovedBody();
  var subject = "Solicitud de descuento COGESTEC Denegada.";
  sendEmail(subject, htmlBody);
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
  var body = "";
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
    SELECTED_PERSON.data.nombres +
    ", bienvenido a COGESTEC 2019 el evento más innovador de Colombia, en este email adjuntaremos un código QR, por favor," +
    " presentalo en el ingreso al evento académico para que hagas el ingreso en las sedes del evento.</p>";
  +"Cordial saludo (nombre y apellidos), bienvenido a COGESTEC 2019 el evento más innovador de Colombia, en este email adjuntaremos un código QR, por favor, presentalo en el ingreso al evento académico para que hagas el ingreso en las sedes del evento." +
    "(adicionar banner publicitario del evento académico)" +
    "Podrás consultar la agenda en el siguiente enlace: http://www.cogestec.co/agenda/" +
    "Recuerda que obtendrás certificado al pasar por las mesas de registro del evento académico.";
  "La información de interés para ponentes se encuentra en el siguiente enlace:" +
    "http://www.cogestec.co/ponentes" +
    "Te agradecemos por hacer parte de la historia de la innovación en Colombia, esperamos conozcas personas y empresas interesadas en la innovación como tú, de la que puedan construir relaciones de mutuo beneficio." +
    "COGESTEC 2019 te desea un excelente día.</p>";
  body = successMsg;
  var qr = getPersonQR();
  body = body.concat(qr);
  return body;
}

function buildAttendantPayApprovedBody() {
  var body = "";
  var successMsg =
    "<p>Cordial saludo (nombre y apellidos), bienvenido a COGESTEC 2019 el evento más innovador de Colombia," +
    " en este email adjuntaremos un código QR, por favor, presentalo en el ingreso al evento académico para que hagas el ingreso en las sedes del evento." +
    "(adicionar banner publicitario del evento académico)" +
    "Podrás consultar la agenda en el siguiente enlace: http://www.cogestec.co/agenda/" +
    "Recuerda que obtendrás certificado al pasar por las mesas de registro del evento académico.</p>";
  body = successMsg;
  var qr = getPersonQR();
  body = body.concat(qr);
  return body;
}

function buildDocDisapprovedBody() {
  var body = "";
  var successMsg =
    "<p>Cordial saludo (nombre y apellidos), lamentamos informar que tu solicitud de descuento ha sido denegada puesto que," +
    "la información adjunta es insuficiente para comprobar tu estado actual como estudiante de pregrado activo." +
    "No te preocupes, aún puedes participar como asistente." +
    "(Adjuntar la información para pago como asistente).</p>";
  body = successMsg;
  return body;
}

function buildDocApprovedBody() {
  var successMsg = "<p></p>";
  var modal =
    "<!DOCTYPE html>" +
    "<html>" +
    "<head>" +
    '<base target="_top" />' +
    '<meta http-equiv="Content-Security-Policy" content="connect-src http:" />' +
    " </head><body>" +
    '<div class="content">' +
    '<div id="result-msg" class="ui message">' +
    successMsg +
    "</div>" +
    '<form class="ui form not-visible" id="modal-form">' +
    '<div id="pay_info_modal" ' +
    'class="ui medium center aligned inverted header">' +
    '<i class="icon lock"></i>' +
    '<div class="content">INFORMACIÓN DE PAGO</div>' +
    "</div>" +
    '<div class="inline field">' +
    "<label>*NIT o Cédula</label>" +
    "<input " +
    'class="numeric" ' +
    'name="cedula_modal" ' +
    'type="text" value="' +
    SELECTED_PERSON.data.cedula +
    '" />' +
    "</div>" +
    '<div class="inline field">' +
    "<label>*Concepto de Pago</label>" +
    "<input " +
    'name="concepto_pago_modal"' +
    'type="text" value="' +
    SELECTED_PERSON.data.concepto_pago +
    '" />' +
    "</div>" +
    '<div class="inline field">' +
    "<label>*Pago Total</label>" +
    "<input " +
    'name="pago_total_modal"' +
    'class="numeric"' +
    'type="text" value="' +
    SELECTED_PERSON.data.pago_total +
    '" />' +
    "</div>" +
    '<div class="inline field">' +
    "<label>*Nombre Completo</label>" +
    '<input name="nombres_modal" placeholder="Nombres" type="text" value="' +
    SELECTED_PERSON.data.nombre +
    '" />' +
    "</div>" +
    '<div class="inline field">' +
    "<label>*Dependencia</label>" +
    "<input " +
    'name="dependencia_modal "' +
    'type="text" value="' +
    SELECTED_PERSON.data.dependecia +
    '" />' +
    "</div>" +
    '<div class="inline field">' +
    '<label class="red">Télefono de Contacto</label>' +
    "<input " +
    'name="telefono_modal"' +
    'class="numeric "' +
    'type="text" value="' +
    SELECTED_PERSON.data.telefono +
    '" />' +
    "</div>" +
    "<br />" +
    '<div class="actions">' +
    "<a " +
    'id="modal-payment" ' +
    'class="ui blue right labeled icon button fluid" ' +
    'onclick="modalPayment()" ' +
    'target=" _blank" ' +
    'href="https://www.psepagos.co/PSEHostingUI/ShowTicketOffice.aspx?ID=4111" ' +
    ">Generar pago";
  "</a>" + "</div>" + "</form>" + "</div>" + "</body></html>";

  return modal;
}
