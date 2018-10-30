let express = require('express');
let app = express();

let bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

let sha1 = require('sha1');
let md5 = require('md5');
let base64 = require('base-64'); // todo check if it need to utf8encode before
let crypto = require('crypto');

let fs = require('fs');
let axios = require('axios');
const querystring = require('querystring');

////
//// Prepearing enviroment
////

require('dotenv').load();
const MERCH_ID = process.env.MERCH_ID;
const MERCH_PRIVATE_KEY = process.env.MERCH_PRIVATE_KEY;
const APP_SECRET_KET = process.env.APP_SECRET_KET;

let last_order_id = process.env.LAST_ORDER_ID || 1;

if (!MERCH_ID || !MERCH_PRIVATE_KEY || !APP_SECRET_KET) {
  console.log("One of theese MERCH_ID MERCH_PRIVATE_KEY APP_SECRET_KET enviroment variables is not defined. Please fill the .env file or see README.md");
  process.exit(1);
}

console.log("MERCH_ID " + MERCH_ID +
  "\nMERCH_PRIVATE_KEY " + MERCH_PRIVATE_KEY +
  "\nAPP_SECRET_KET " + APP_SECRET_KET +
  "\nlast_order_id=" + last_order_id);



////
//// Helper function
////

// each transaction must have its unique order_id
function dummySaveLastOrderID(last_order_id) {
  let new_order_id_str = 'LAST_ORDER_ID=' + last_order_id;
  let data = fs.readFileSync('.env', 'utf-8');
  let newValue = data.replace(/^(LAST_ORDER_ID=(\d+)?)/gim, new_order_id_str);
  if (newValue === data)
    newValue += "\n" + new_order_id_str + "\n";

  fs.writeFileSync('.env', newValue, 'utf-8');
}


////
//// Server controllers
////

////// Getting params for payment window
// todo fetch any usefull data from request
var stringify = require('json-stable-stringify');
app.get('/app_params', function (req, res) {
  let amount = 1;

  merch_data = {
    amount: amount,
    order_id: ++last_order_id,
    currency: "RUB",
    ts: (Date.now() / 1000 | 0), 
    cashback: { pay_time: (Date.now() / 1000 | 0) + 100, amount_percent: 10 }
  };

  dummySaveLastOrderID(last_order_id);

  merch_data_base64 = base64.encode(JSON.stringify(merch_data))
  let data = {
    order_id: merch_data.order_id,
    ts: merch_data.ts,
    currency: "RUB",
    merchant_data: merch_data_base64,
    merchant_sign: sha1(merch_data_base64 + MERCH_PRIVATE_KEY),
    event_name: "ыва", // you can put here any data you want
    offline_cashback: {"name": 'Test for offline cashback', "avatar": 'https://content.foto.my.mail.ru/corp/d.tarasov/_myphoto/h-2.jpg'}
  };

  let pay_window_params = {
    amount: amount,
    data: data,
    description: "Оплата заказа",
    action: "pay-to-service",
    merchant_id: MERCH_ID,
    version: 2
  }

  let params = ""
  Object.keys(pay_window_params).sort((a, b) => a > b).forEach(
          function (key) { if (key != "action") params += key + "=" + ( key == "data"? stringify( pay_window_params[key] ) : pay_window_params[key]  ) }
  )
  console.log("params=\n", params)
  pay_window_params.sign = md5(params + APP_SECRET_KET)

  console.log("response:" + JSON.stringify(pay_window_params));
  res.json(pay_window_params); // responsing with json
});

////// url_for_payment_status_notifications :)

let transactions_hash = {};
const pubKeyData = fs.readFileSync("certs/dmr_notifications.crt");

app.post('/url_for_payment_status_notifications', (req, res) => {
  // var certificate = fs.readFileSync('certificate.pem', "utf8");
  console.log("in url_for_payments_status_notificatio\n", req.body);

  var verifier = crypto.createVerify('RSA-SHA1');
  verifier.update(req.body.data);

  let result = verifier.verify(pubKeyData, req.body.signature, 'base64') 
  if(false && !result) {
    console.log("bad sign!");
    res.json({});
    return;
  }
  console.log("sign is ok");

  let req_data = JSON.parse(base64.decode(req.body.data));
  console.log(" req_data:", req_data);


  let data = {
    body: {
      transaction_id: req_data.body.transaction_id,
      notify_type: "TRANSACTION_STATUS"
    },
    header: {
      status: "OK",
      ts: ((new Date() / 1000) | 0),
      client_id: MERCH_ID
    }
  };
  console.log(JSON.stringify(transactions_hash,null,2));
  if(req_data.body.transaction_id in transactions_hash) {
    console.log("DUPLICATE!");
    data.header["status"] = "ERROR";
    data.header["error"] = {
      "code":"ERR_DUPLICATE",
      "message":"This notificaction has already been got"
    };
    transactions_hash[req_data.body.transaction_id]  += 1;
  }
  else {
    transactions_hash[req_data.body.transaction_id] = 1;
  }
  console.log("data ", JSON.stringify(data, null, 2));
  let notification_resp = { data: base64.encode(JSON.stringify(data)), version: req.body.version };
  console.log("for sign = ", notification_resp.data + MERCH_PRIVATE_KEY);
  notification_resp.signature = sha1(notification_resp.data + MERCH_PRIVATE_KEY);
  console.log("notification_resp", JSON.stringify(notification_resp,null,2)); // responsing with json
  res.json( notification_resp );

  // openssl.verifyCertificate(certificate, 'certs', function(result) {
  //     console.log(result);
  // })

})


////
//// REFUNDS
////

const DMR_API_URL = 'https://api-spare.money.mail.ru';
const DMR_REFUND_URL = '/money/2-02/transaction/refund'; // its important thet theere is no slash at the end
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

app.post("/refund", (req, res) => {
  console.log("in refund");

  let data = {
    body: {
      transaction_id: req.query["txn_id"],
      reason: req.query["reason"] || "Any reason"
//      amount: 49
    },
    header: {
      ts: ((new Date() / 1000) | 0),
      client_id: MERCH_ID
    }
  };

  console.log("data:", data);

  let base64_data = base64.encode(JSON.stringify(data));
  let sign = sha1(DMR_REFUND_URL + base64_data + MERCH_PRIVATE_KEY);
  console.log("data:", base64_data);
  console.log("sign:", sign);
  console.log("body:", querystring.stringify({ data: base64_data, signature: sign }));
  axios.post(DMR_API_URL + DMR_REFUND_URL, querystring.stringify({ data: base64_data, signature: sign }))
    .then(function (response) {
      console.log(response.data);
      console.log(response.status);
      console.log(response.statusText);
      console.log(response.headers);
      console.log(response.config);
    }).catch((error) => {
      console.log('Promise error', error.message);
    });;

  res.json({ status: "ok" });


})

app.listen(process.env.VKPAY_DEMO_BACKEND_PORT, function () {
  console.log('Example app listening on port ' + process.env.VKPAY_DEMO_BACKEND_PORT);
});
