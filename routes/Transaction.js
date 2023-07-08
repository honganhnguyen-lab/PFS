const express = require("express");
const router = express.Router();
const transaction = require("../controllers/transaction");
const moment = require("moment");

router.post("/create_payment_url", transaction.create_payment_url);
router.get("/vnpay_return", transaction.vnpay_return);
router.get("/vnpay_ipn", transaction.vnpay_ipn);
router.get("/getAllTransaction", transaction.getListTransaction);
router.get("/search", transaction.searchTransaction);
router.post("/delete-transaction/:id", transaction.deleteTransaction);
router.get("/info-transaction/:id", transaction.getOneTransactionId);
router.get("/result-payment", transaction.getResultUrl);

module.exports = router;

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
