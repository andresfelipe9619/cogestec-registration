function onSpreadSheetEdit(e) {
  var range = e.range;
  Logger.log(range);
  checkEditedCell(range);
}

function checkEditedCell(range) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rawPerson = [];
  var payload = { person: null, type: null };
  //SI PAGO COMPROBADO
  if (range.getColumn() == 8 && range.getValue() == "SI") {
    var sheetValues = sheet.getSheetValues(
      range.getRow(),
      1,
      1,
      sheet.getLastColumn()
    );
    Logger.log(sheetValues);
    rawPerson = sheetValues[0];
    payload.type = "PAY";
    payload.person = {
      cedula: rawPerson[2],
      nombre: rawPerson[0] + " " + rawPerson[1],
      email: rawPerson[3]
    };
  }
  //SI DOCUMENTO VERIFICADO
  if (range.getColumn() == 10 && range.getValue() == "SI") {
    var sheetValues = sheet.getSheetValues(
      range.getRow(),
      1,
      1,
      sheet.getLastColumn()
    );
    Logger.log(sheetValues);
    rawPerson = sheetValues[0];
    payload.type = "DOC";
    payload.person = {
      cedula: rawPerson[2],
      nombre: rawPerson[0] + " " + rawPerson[1],
      email: rawPerson[3],
      pago_total: rawPerson[6],
      concepto_pago: rawPerson[5],
      dependecia: "COGESTEC 2019",
      telefono: rawPerson[4]
    };
  }

  Logger.log(payload);
  sendConfirmationEmail(payload);
}

function sendConfirmationEmail(payload) {
  var body = "";
  if (payload) {
    body = createHtmlBody(payload);
    if (payload.type == "DOC") {
      MailApp.sendEmail({
        to: payload.person.email,
        subject: "Inscripción verificada",
        name: "COGESTEC 2019",
        // attachments: [],
        htmlBody: body
      });
    } else if (payload.type == "PAY") {
      MailApp.sendEmail({
        to: payload.person.email,
        subject: "Pago comprobado",
        name: "COGESTEC 2019",
        htmlBody: body
      });
    }
  }
}

function createHtmlBody(payload) {
  var result = "";
  var person = payload.person;
  if (payload.type == "DOC") {
    result = generateModal(person);
  } else if (payload.type == "PAY") {
    result = generateQR(person);
  }
  return result;
}

function generateQR(person) {
  var body = "";
  var qrserver = "http://api.qrserver.com/v1/create-qr-code/";
  var successMsg = "<p>Cordial saludo "+person.nombres + " "+ person.apellidos +
  ", bienvenido a COGESTEC 2019 el evento más innovador de Colombia, en este email adjuntaremos un código QR, por favor,"+
  " presentalo en el ingreso al evento académico para que hagas el ingreso en las sedes del evento.</p>";
  if(person.concepto_pago.contains("esearcher")){
    successMsg += "Cordial saludo (nombre y apellidos), bienvenido a COGESTEC 2019 el evento más innovador de Colombia, en este email adjuntaremos un código QR, por favor, presentalo en el ingreso al evento académico para que hagas el ingreso en las sedes del evento."+
    "(adicionar banner publicitario del evento académico)"+
    "Podrás consultar la agenda en el siguiente enlace: http://www.cogestec.co/agenda/"+
    "Recuerda que obtendrás certificado al pasar por las mesas de registro del evento académico."
  }else {
    successMsg += 
    "<p>Recuerda que obtendrás certificado como ponente por presentar tu ponencia en la fecha y hora asignadas y como asistente al evento, al pasar por la mesa de registro el día del evento."+
    "Recuerda que siempre podrás consultar la agenda en el siguiente enlace: http://www.cogestec.co/agenda/"+
    "La información de interés para ponentes se encuentra en el siguiente enlace:"+
    "http://www.cogestec.co/ponentes"+
    "Te agradecemos por hacer parte de la historia de la innovación en Colombia, esperamos conozcas personas y empresas interesadas en la innovación como tú, de la que puedan construir relaciones de mutuo beneficio."+
    "COGESTEC 2019 te desea un excelente día.</p>"
  }
  body = successMsg;
  var qrimage =
    '' +
    '<img src="' +
    qrserver +
    "?color=000000&amp;bgcolor=FFFFFF&amp;" +
    "data=" +
    person.cedula +
    '&amp;qzone=1&amp;margin=0&amp;size=400x400&amp;ecc=L" alt="qr code" />';
    successMsg += body;
  return qrimage;
}

function generateModal(person) {

  var modal =
    "<!DOCTYPE html>" +
    "<html>" +
    "<head>" +
    '<base target="_top" />' +
    '<meta http-equiv="Content-Security-Policy" content="connect-src http:" />' +
    "<link" +
    'rel="stylesheet"' +
    'href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.3.3/semantic.min.css"' +
    "/>" +
    "<?!= include('style'); ?>" +
    " </head><body>" +
    '<div class="content">' +
    '<div id="result-msg" class="ui message">'+successMsg +'</div>' +
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
    person.cedula +
    '" />' +
    "</div>" +
    '<div class="inline field">' +
    "<label>*Concepto de Pago</label>" +
    "<input " +
    'name="concepto_pago_modal"' +
    'type="text" value="' +
    person.concepto_pago +
    '" />' +
    "</div>" +
    '<div class="inline field">' +
    "<label>*Pago Total</label>" +
    "<input " +
    'name="pago_total_modal"' +
    'class="numeric"' +
    'type="text" value="' +
    person.pago_total +
    '" />' +
    "</div>" +
    '<div class="inline field">' +
    "<label>*Nombre Completo</label>" +
    '<input name="nombres_modal" placeholder="Nombres" type="text" value="' +
    person.nombre +
    '" />' +
    "</div>" +
    '<div class="inline field">' +
    "<label>*Dependencia</label>" +
    "<input " +
    'name="dependencia_modal "' +
    'type="text" value="' +
    person.dependecia +
    '" />' +
    "</div>" +
    '<div class="inline field">' +
    '<label class="red">Télefono de Contacto</label>' +
    "<input " +
    'name="telefono_modal"' +
    'class="numeric "' +
    'type="text" value="' +
    person.telefono +
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

function sendPostRequest(payload) {
  var url =
    "https://script.google.com/macros/s/AKfycbw3gbuDvJwe5_pccF52DLGu8Jqeh8zKmy-_P14omklUvu74Kb2z/exec";
  var options = {
    method: "POST",
    payload: JSON.stringify(payload),
    contentType: "application/json",
    followRedirects: true,
    muteHttpExceptions: true,
    validateHttpsCertificates: false
  };
  Logger.log("FETCHING...");
  var result = UrlFetchApp.fetch(url, options);
  Logger.log(result);
  if (result.getResponseCode() == 200) {
    var params = JSON.parse(result.getContentText());
    Logger.log("Email send correctly");
    Logger.log(params);
  }
}
