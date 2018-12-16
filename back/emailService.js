function onEdit(e) {
  // Set a comment on the edited cell to indicate when it was changed.
  var range = e.range;
  range.setNote("Last modified: " + new Date());
  sendEmail(range);
}

function sendEmail(range) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rawPerson = [];
  var payload = { person: null, type: null };
  //PAGO COMPROBADO
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
  //DOCUMENTO VERIFICADO
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
  sendPostRequest(payload);
}
function sendPostRequest(payload) {
  var url =
    "https://script.google.com/a/correounivalle.edu.co/macros/s/AKfycbw3gbuDvJwe5_pccF52DLGu8Jqeh8zKmy-_P14omklUvu74Kb2z/exec";

  var options = {
    method: "POST",
    payload: payload,
    followRedirects: true,
    muteHttpExceptions: true
  };

  var result = UrlFetchApp.fetch(url, options);

  if (result.getResponseCode() == 200) {
    var params = JSON.parse(result.getContentText());
    Logger.log("Email send correctly");
    Logger.log(params)
  }
}
