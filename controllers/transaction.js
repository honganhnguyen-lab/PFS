const Transaction = require("./../models/transactionModel");
const dotenv = require("dotenv");
const moment = require("moment");

dotenv.config({ path: "./config.env" });
const User = require("./../models/userModel");
const { updateAppointment } = require("./appoinmentController");
const Appointment = require("../models/appointmentModel");

const defineStatus = {
  notPayYet: 0,
  pending: 1,
  confirm: 2,
  reject: 3,
  processing: 4,
  done: 5
};

exports.getResultUrl = async (req, res) => {
  console.log("is Error from here");
  if (req.query.vnp_TransactionStatus === "00") {
    res.render("template", { isSuccess: true });
    try {
      const appointment = await Appointment.findByIdAndUpdate(
        req.query.appointmentId,
        { status: 1 }
      );

      console.log("Updated appointment:", appointment);
    } catch (error) {
      console.log("Error updating appointment status:", error);
    }
  } else {
    res.render("template", { isSuccess: false });
  }

  res.status();
};

exports.create_payment_url = async (req, res, next) => {
  try {
    process.env.TZ = "Asia/Ho_Chi_Minh";

    let date = new Date();
    let createDate = moment(date).format("YYYYMMDDHHmmss");

    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    let tmnCode = "NAVP8HQ2";
    let secretKey = "CUNJHPWJUWLYJXQKUKITOAIGZTAOMHUT";
    let appointmentId = req.body.appointmentId;
    let vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    let returnUrl = `https://pfs.try0.xyz/api/v1/transaction/result-payment?appointmentId=${appointmentId}`;
    let orderId = moment(date).format("DDHHmmss");
    let amount = req.body.amount;
    let bankCode = req.body.bankCode;

    let locale = req.body.language;
    if (locale === null || locale === "") {
      locale = "vn";
    }
    let currCode = "VND";
    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = locale;
    vnp_Params["vnp_CurrCode"] = currCode;
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100;
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;
    if (bankCode !== null && bankCode !== "") {
      vnp_Params["vnp_BankCode"] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    let querystring = require("qs");
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

    res.send(vnpUrl);
  } catch (err) {
    console.log(err);
  }
};

module.exports.vnpay_ipn = async function (req, res) {
  try {
    let vnp_Params = req.query;
    let secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    const secretKey = config.vnp_HashSecret;
    const querystring = require("qs");
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac
      .update(new Buffer.from(signData, "utf-8"))
      .digest("hex");

    if (secureHash === signed) {
      const orderId = vnp_Params["vnp_TxnRef"];
      const rspCode = vnp_Params["vnp_ResponseCode"];
      const tsCode = vnp_Params["vnp_TransactionStatus"];
      const amount = vnp_Params["vnp_Amount"];
      //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
      const currentTransaction = await Transaction.findOne({
        orderId: orderId
      });
      if (currentTransaction.orderId === orderId) {
        if (currentTransaction.amount === amount / 100) {
          if (rspCode === "00" && tsCode === "00") {
            await Transaction.findOneAndUpdate(
              { orderId: orderId },
              { TransactionStatus: 1 }
            );
            res.status(200).json({ RspCode: "00", Message: "success" });
          } else {
            await Transaction.findOneAndUpdate(
              { orderId: orderId },
              { TransactionStatus: 2 }
            );
          }
        }
      }
    }
  } catch (RspCode) {
    console.log(RspCode);
    res.status(200).json({ RspCode: "99", Message: "Unknow error" });
  }
};

module.exports.vnpay_return = async function (req, res) {
  let vnp_Params = req.query;
  let secureHash = vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);
  let tmnCode = config.vnp_TmnCode;
  let secretKey = config.vnp_HashSecret;

  let querystring = require("qs");
  let signData = querystring.stringify(vnp_Params, { encode: false });
  let crypto = require("crypto");
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(new Buffer.from(signData, "utf-8")).digest("hex");
  if (secureHash === signed) {
    try {
      const orderId = vnp_Params["vnp_TxnRef"];
      let paymentResults = Transaction.findOne({ orderId: orderId });
      return res.status(200).json({
        data: paymentResults
      });
    } catch (err) {
      return res.status(500).json({ code: 1, error: "server error" });
    }
  }
};

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
// list
module.exports.getListTransaction = async function (req, res) {
  try {
    let transaction = await Transaction.find({});
    return res.status(200).json({
      data: transaction
    });
  } catch (err) {
    return res.status(500).json({ code: 1, error: "server error" });
  }
};
// search transaction
module.exports.searchTransaction = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    if (req.query.orderId === "") {
      const transactions = await Transaction.find({});
      return res.status(200).json({
        code: 0,
        data: transactions
      });
    }
    const transactions = await Transaction.find({
      $or: [
        {
          orderId: {
            $regex: orderId,
            $options: "i"
          }
        }
      ]
    });
    if (!transactions) {
      return res.status(404).json({
        code: 0,
        message: "transaction not found"
      });
    }
    if (transactions) {
      return res.status(200).json({
        code: 1,
        data: transactions
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ code: 1, error: "Server error" });
  }
};
// delete transaction
module.exports.deleteTransaction = async (req, res) => {
  try {
    const idTransaction = req.params.id;
    const userUpdate = await User.findOneAndUpdate(
      { "transactions.transactionId": idTransaction },
      { $pull: { transactions: { transactionId: idTransaction } } }
    );
    if (!userUpdate) {
      return res.status(404).json({ code: 0, message: "user not found" });
    }
    const deleteTransaction = await Transaction.findOneAndRemove({
      _id: idTransaction
    });
    if (!deleteTransaction) {
      return res
        .status(404)
        .json({ code: 0, message: "transaction not found!" });
    }
    if (deleteTransaction) {
      return res.status(200).json({
        code: 1,
        message: "Delete Forever transaction success"
      });
    }
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};

// get transaction by id.
module.exports.getOneTransactionId = async (req, res) => {
  try {
    const IdTransaction = req.params.id;
    const infoTransaction = await Transaction.findOne({
      orderId: IdTransaction
    });
    if (!infoTransaction) {
      return res
        .status(404)
        .json({ code: 0, message: "transaction not found" });
    }
    if (infoTransaction) {
      return res.status(200).json({
        code: 1,
        data: infoTransaction
      });
    }
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};

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
