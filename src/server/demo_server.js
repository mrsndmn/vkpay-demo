let express = require('express');
let app = express();

require('dotenv').load();

let sha1 = require('sha1');
let md5 = require('md5');
let fs = require('fs');

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
  let data = fs.readFileSync('.env', 'utf-8');
  let newValue = data.replace(/^LAST_ORDER_ID=(\d+)?/gim, 'LAST_ORDER_ID='+last_order_id);
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
      "merchant_sign": sha1( merch_data_base64 + MERCH_PRIVATE_KEY )
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


app.post('/url_for_payments_status_notifications', (req, res) => {
  console.log("in url_for_payments_status_notifications:\n", req);
})


app.listen(process.env.VKPAY_DEMO_BACKEND_PORT, function () {
  console.log('Example app listening on port ' + process.env.VKPAY_DEMO_BACKEND_PORT);
});