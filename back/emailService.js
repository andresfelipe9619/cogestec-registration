function onEdit(e) {
    // Set a comment on the edited cell to indicate when it was changed.
    var range = e.range;
   
    range.setNote('Last modified: ' + new Date());
  }
  
  function sendEmail(){
    var url = '';
    var paylaod = null;
    var options = {
        'method': 'post',
        'contentType': 'application/x-www-form-urlencoded',
        'validateHttpsCertificates': false
    }

   if(range.getColumn() == 8 && range.getValue() == 'SI'){
    payload = 'email=' + email,
    options.paylaod = paylaod
    }
   if(range.getColumn() == 10 && range.getValue() == 'SI'){

          var result = UrlFetchApp.fetch('http://arzayus.co/egresados-script.php', options).getContentText();
    }
  
  }

  