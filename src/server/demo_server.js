let express = require('express');
let app = express();

require('dotenv').load();

let sha1 = require('sha1');
let md5 = require('md5');

const MERCH_ID = process.env.MERCH_ID || process.exit(1);
const MERCH_PRIVATE_KEY = process.env.MERCH_PRIVATE_KEY || process.exit(1);
const APP_SECRET_KET    = process.env.APP_SECRET_KET || process.exit(1);

//                              pretty dirty hack. you have to count yours orders
let last_order_id = Math.random()*100000 | 0; // omg js: DOUBLE_NUMBER | 0 = (int) DOUBLE_NUMBER


app.get('/app_params', function (req, res) {
  let amount = 1;

  merch_data = {
    "amount": amount,
    "order_id": last_order_id++,
    "currency": "RUB",
    "ts": + new Date(),
  }

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

app.listen(process.env.VKPAY_DEMO_BACKEND_PORT, function () {
  console.log('Example app listening on port ' + process.env.VKPAY_DEMO_BACKEND_PORT);
});