let express = require('express');
let app = express();

require('dotenv').load();

let sha1 = require('sha1');
let md5 = require('md5');
let fs = require('fs');
let axios = require('axios');

var openssl = require('openssl-verify');

const MERCH_ID = process.env.MERCH_ID || process.exit(1);
const MERCH_PRIVATE_KEY = process.env.MERCH_PRIVATE_KEY || process.exit(1);
const APP_SECRET_KET    = process.env.APP_SECRET_KET || process.exit(1);

let last_order_id = process.env.LAST_ORDER_ID || 1;
console.log("MERCH_ID " + MERCH_ID +
            "\nMERCH_PRIVATE_KEY " + MERCH_PRIVATE_KEY +
            "\nAPP_SECRET_KET " + APP_SECRET_KET +
            "\nlast_order_id=" + last_order_id)


// each transaction must have its unique order_id
function dummySaveLastOrderID(last_order_id) {
  let new_order_id_str = 'LAST_ORDER_ID='+last_order_id;
  let data = fs.readFileSync('.env', 'utf-8');
  let newValue = data.replace(/^(LAST_ORDER_ID=(\d+)?)/gim, new_order_id_str);
  if (newValue === data)
    newValue += "\n" + new_order_id_str + "\n";

  fs.writeFileSync('.env', newValue, 'utf-8');
}

app.get('/app_params', function (req, res) {
  let amount = 1;

  merch_data = {
    "amount": amount,
    "order_id": last_order_id,
    "currency": "RUB",
    "ts": + new Date(),
  };

  dummySaveLastOrderID(++last_order_id);

  merch_data_base64 = Buffer.from(JSON.stringify(merch_data)).toString('base64')

  let data = {
      "order_id": merch_data.order_id,
      "ts": merch_data.ts,
      "currency": "RUB",
      "merchant_data": merch_data_base64,
      "merchant_sign": sha1( merch_data_base64 + MERCH_PRIVATE_KEY ),
      "my_own_key": 123123123123 // you can put here any data you want
  };

  let pay_window_params = {
    "amount": amount,
    "data": JSON.stringify(data),
    "description": "Оплата заказа",
    "action": "pay-to-service",
    "merchant_id": MERCH_ID,
  }

  let params = ""
  Object.keys(pay_window_params).forEach(function(key){ if (key != "action") params += key + "=" + pay_window_params[key] })
  console.log("params=\n", params )
  pay_window_params.sign = md5(params + APP_SECRET_KET)

  console.log("response:" + JSON.stringify(pay_window_params));
  res.json(pay_window_params); // responsing with json
});

app.post('/url_for_payment_status_notifications', (req, res) => {
  // var certificate = fs.readFileSync('certificate.pem', "utf8");
  console.log("in url_for_payments_status_notifications:\n", req);
  req = req;

  let data = {};
  let sign = sha1( Buffer.from(JSON.stringify(data) + MERCH_PRIVATE_KEY ).toString('base64') )

  res.json({"data": data, "signature": sign});

  // openssl.verifyCertificate(certificate, 'certs', function(result) {
  //     console.log(result);
  // })

})


const DMR_API_URL = 'https://api-spare.money.mail.ru';
const DMR_REFUND_URL = '/money/2-02/transaction/refund';
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

app.post("/refund", (req, res) => {
  console.log("in refund");

  let data = {
    body: {
      transaction_id: req.param("txn_id"),
      reason: req.param("reason")
    },
    header: {
      ts: + new Date(),
      client_id: MERCH_ID
    }
  };

  console.log("data:", data);


  let base64_data = Buffer.from(JSON.stringify(data)).toString('base64');
  let sign = sha1( DMR_REFUND_URL + base64_data + MERCH_PRIVATE_KEY )

  axios.post(DMR_API_URL + DMR_REFUND_URL, { data: base64_data, signature: sign })
        .then(function(response) {
            console.log(response.data);
            console.log(response.status);
            console.log(response.statusText);
            console.log(response.headers);
            console.log(response.config);
        }
  );


})

app.listen(process.env.VKPAY_DEMO_BACKEND_PORT, function () {
  console.log('Example app listening on port ' + process.env.VKPAY_DEMO_BACKEND_PORT);
});
