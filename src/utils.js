'use strict';

const uuid = require('uuid');
const { Get } = require('./dynamo');
const crypto = require("crypto-js");

module.exports.validateRequest = (requestBody, validationMatrix) => {
  for (let key in validationMatrix) {
    if (typeof requestBody[key] !== validationMatrix[key]) {
      return {status: false, message: `Invalid input. ${key} must be a ${validationMatrix[key]}.`};
    }
    if (typeof requestBody[key] === 'string' && requestBody[key].trim() === '') {
      return {status: false, message: `Invalid input. ${key} cannot be empty.`};
    }
    if (typeof requestBody[key] === 'number' && requestBody[key] < 0) {
      return {status: false, message: `Invalid input. ${key} cannot be negative.`};
    }
  }
  return {status: true};
};

module.exports.apiResponse = (statusCode, body) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json'
    }
  };
};

module.exports.itemInfo = (requestBody, useId) => {
  const timestamp = new Date().getTime();
  if (useId) {
    requestBody['id'] = uuid.v1();
  }
  requestBody['submittedAt'] = timestamp;
  requestBody['updatedAt'] = timestamp;
  return requestBody;
};

module.exports.itemUpdateInfo = (requestBody) => {
  const timestamp = new Date().getTime();
  for (let key in requestBody) {
    requestBody[key] = {Value: requestBody[key], Action: 'PUT'};
  }
  requestBody['updatedAt'] = {Value: timestamp, Action: 'PUT'};
  return requestBody;
};

module.exports.createInvoice = async (cart) => {
  let items = [];
  let total = 0;
  for(let i = 0; i < cart.Items.length; i++) {
    let key = {id: cart.Items[i].productId};
    let product = await Get(key, process.env.PRODUCTS);
    let item = {
      product: product.Item.product,
      unitPrice: product.Item.price,
      brand: product.Item.brand,
      amount: cart.Items[i].amount,
      price: product.Item.price * cart.Items[i].amount
    }
    total += item.price;
    items.push(item);
  }
  let vat = total * 0.19;
  let subtotal = total - vat;
  return {
    date: new Date().toISOString(),
    items: items, 
    vat: vat, 
    subtotal: subtotal,
    total: total, 
  };
};

module.exports.checkPaymentGateway = (body, props) => {
  let key;
  for (var i = 0; i < props.length; i++) {
    key = body.hasOwnProperty(props[i]);
    if (!key) {
      break;
    }
  }
  return key;
};

module.exports.encryptData = (data, iv, key) => {
  let encryptedString = crypto.AES.encrypt(data, key, {
    iv: iv,
    mode: crypto.mode.CBC,
    padding: crypto.pad.Pkcs7,
  });
  return encryptedString.toString();
}

module.exports.decryptData = (encrypted, iv, key) => {
  let decrypted = crypto.AES.decrypt(encrypted, key, {
    iv: iv,
    mode: crypto.mode.CBC,
    padding: crypto.pad.Pkcs7,
  });
  return decrypted.toString(crypto.enc.Utf8);
}