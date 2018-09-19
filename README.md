# VKPay demo app

## Disclaimer
Sorry, but i'm not js programmer. Possibly there is exists better way to do that. But that application is just a demo that could be started easily on your localhost. It is not production solution! Just example or a sandbox.
Feel free to suggest pull requests.

Also I'm sure that if you fill the .env variables correctly you will get awesome working vkpay button.

## Little warning
This application can be opened only inside of vk applocation iframe.

## Getting started
You can use it this app either as temporary backend app or frontend one or both.

Make shure that node-js and npm are installed

```bash
npm install
cp .env.example .env

# now you have to fill the merchant and apps parameters in .env
npm run demo-server # starting demo backend
npm start # starting frontend app
```
After you start the last command https://127.0.0.1:3000/ will be opened in your brouser with "Error: Wrong window.name property." message. Its normal behaviour. See [little warning](#Little-warning)


### todo
* dmr notifications
* refunds
* example: site application
* modal window traps

