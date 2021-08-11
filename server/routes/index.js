var express = require('express');
var router = express.Router();
const env = require("dotenv").config({ path: "./.env"});
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const logger = require("../logger");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// ミドルウェアの処理
router.post("/v1/order/payment", async function(req, res, next){
  logger.info("ルータメソッドの処理を開始します. リクエスト : ", req.body); // リクエスト受け付けたログ出力

  const { paymentMethodId, paymentIntentId, items, currency, useStripeSdk } = req.body;

  const total = calculateAmount(req.body.items); // 後述

  try { // < try-catch文>

    let intent;
    if (paymentMethodId) {
      const request = {
        amount: total,
        currency: currency,
        payment_method: paymentMethodId,
        confirmation_method: "manual",
        confirm: true,
        use_stripe_sdk: useStripeSdk
      }
  
      logger.info("Stripe APIを呼び出します. リクエスト : ", request); // StripeAPIに接続する際のログ出力
      intent = await stripe.paymentIntents.create(request);
      logger.info("Stripe APIを呼び出しました. レスポンス : ", intent); // StripeAPIを呼び出せたらログ出力
  
    } else if (paymentIntentId) {
      intent = await stripe.paymentIntents.confirm(paymentIntentId);
    }
  
    const response = generateResponse(intent); // 後述
    logger.info("ルータメソッドの処理を終了します. レスポンス : ", response); // 呼び出したStripeをResponseするログ出力
  
    res.send(response);

  } catch (e) {
    logger.error("ルータメソッドの処理中にエラーが発生しました : ", e);
    const response = generateErrorResponse(e.message);

    res.status(500);
    res.send(response);
  }
});

// 商品代金の計算処理
function calculateAmount(items){
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    const current = items[i].amount * items[i].quantity;
    total += current;
  }
  return total;
};

// Stripe API の処理を受け取りレスポンスを生成する処理
function generateResponse(paymentIntent) {
  let response = {
      requiresAction: false,
      clientSecret: "",
      paymentIntentStatus : ""
  }

  switch (paymentIntent.status) {
      case "requires_action":
          response.paymentIntentStatus = "requires_action";
          break;
      case "requires_source_action":
          response.paymentIntentStatus = "requires_source_action";
          response.requiresAction = true;
          response.clientSecret = paymentIntent.client_secret;
          break;
      case "requires_payment_method":
          response.paymentIntentStatus = "requires_payment_method";
          break;
      case "requires_source":
          response.paymentIntentStatus = "requires_source";
          response.error = {
              messages : ["カードが拒否されました。別の決済手段をお試しください"]
          }
          break;
      case "succeeded":
          response.paymentIntentStatus = "succeeded";
          response.clientSecret = paymentIntent.client_secret;
          break;
      default:
          response.error = {
              messages : ["システムエラーが発生しました"]
          }
          break;
  }

  return response;
};

// ログ出力のためのエラーレスポンス生成関数
function generateErrorResponse (error) {
  return {
    error : {
      messages : [error]
    }
  }
};

module.exports = router;