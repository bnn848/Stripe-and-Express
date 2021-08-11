// =====================================
// Stripeをインスタンス化する
// =====================================
var stripe = Stripe("pk_test_xxx"); // 公開鍵
var elements = stripe.elements();

// =====================================
// 注文情報の初期化
// =====================================
var order = {
  items : [
    {
      name : "scrab",
      amount : 2000,
      quantity : 2
    },
    {
      name : "soap",
      amount : 1500,
      quantity : 1
    }
  ],
  currency : "jpy",
  paymentMethodId : null
};

// =====================================
// スタイル定義した上でcard.htmlのdivタグにマウント
// =====================================
var style = {
  base: {
    color: "#32325d",
  }
};

var card = elements.create("card", { style: style });
card.mount("#card-element"); // card.htmlのdiv#card-elementに紐付ける

// =====================================
// クレジットカード情報のチェック
// =====================================
card.on('change', ({error}) => {
  const displayError = document.getElementById('card-errors');
  if (error) {
    displayError.textContent = error.message;
  } else {
    displayError.textContent = '';
  }
});

// =====================================
// 注文確定ボタンのクリックイベント
// =====================================
const submitButton = document.getElementById("payment-form-submit");
submitButton.addEventListener('click', e => {
  stripe
    .createPaymentMethod("card", card)
    .then(result => {

      if(result.error) {
        onError();
      } else {
        order.paymentMethodId = result.paymentMethod.id;

        // サーバサイドへ決済情報を渡して結果をハンドリングする
        // サーバは http://localhost:3000/v1/order/payment にPOSTでリクエストを受け付けている
        fetch("http://localhost:3000/v1/order/payment",
          {
            method: "POST", // データを送信するメソッド
            headers: {"Content-Type": "application/json"}, // HTTPヘッダー
            body: JSON.stringify(order) // リクエスト内容
          }
        )
        .then(result => {
          return result.json(); // レスポンスをJSONで取り出す
        })
        .then(response => { // 取り出したJSON受け取って処理する
          onComplete();
        });
      }

    })
    .catch(() => {
      onError();
    })
});

// ボタンの要素を取得
let returnButtonNormal = document.getElementById("return-button-normal");
let returnButtonError = document.getElementById("return-button-error");
let returnButtonNotYet = document.getElementById("return-button-not-yet");
let returnButtonDefault = document.getElementById("return-button-default");

returnButtonNormal.addEventListener("click", reset);
returnButtonError.addEventListener("click", reset);
returnButtonNotYet.addEventListener("click", reset);
returnButtonDefault.addEventListener("click", reset);

// =====================================
// カード情報入力後の動作(上記EventListenerにて利用)
// =====================================

/**
 * イベントハンドラ。リセットする。
 * @param event 
 */

// 入力をリセット
function reset(event) {
  hideError(); // 各メッセージ＆ボタンを隠す
  hideMessage();
  hideNotYetMessage();
  displayButton();

  card.mount("#card-element"); // 再度inputに接続する
};

// 処理が正常終了した場合の処理
function onComplete(response) {
  shutdown(); // 後述
  hideSpinner();

  if(response.error) {
    onError();
  } else if (response.paymentIntentState === "succeeded") {
    displayMessage();
  } else {
    displayNotYetMessage();
  }
};

// 処理中にエラーが発生した場合の処理
function onError() {
  shutdown();

  if(!document.querySelector(".spinner-border").classList.contains("collapse")) {
    hideSpinner();
  }

  displayError();
};

function shutdown() {
  card.unmount(); // DOMとelementの接続を切る
  hideButton();
};

// ---------------------------
// x. 表示関連のスニペット
// ---------------------------

// ロード中のスピナー
function hideSpinner() {
  document.querySelector(".spinner-border").classList.add("collapse");
};

function displaySpinner() {
  document.querySelector(".spinner-border").classList.remove("collapse");
};

// エラーメッセージ
function hideError() {
  document.querySelector(".contents-payment-error").classList.add("collapse");
}

function displayError() {
  document.querySelector(".contents-payment-error").classList.remove("collapse");
}

// 成功メッセージ
function displayMessage() {
  document.querySelector(".contents-payment-result").classList.remove("collapse");
}

function hideMessage() {
  document.querySelector(".contents-payment-result").classList.add("collapse");
}

function displayNotYetMessage() {
  document.querySelector(".contents-payment-not-yet").classList.remove("collapse");
}

function hideNotYetMessage() {
  document.querySelector(".contents-payment-not-yet").classList.add("collapse");
}

// 注文確定ボタン
function hideButton() {
  document.querySelector("#payment-form-submit").classList.add("collapse");
}

function displayButton() {
  document.querySelector("#payment-form-submit").classList.remove("collapse");
}
