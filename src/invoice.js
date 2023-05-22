'use strict';

const AWS = require('aws-sdk'); 
const { Submit, List, Get, Update } = require('./dynamo');
const { validateRequest, apiResponse, itemInfo, itemUpdateInfo } = require('./utils');

AWS.config.setPromisesDependency(require('bluebird'));

const validationMatrix = {
  userId: 'string',
  paymentMethod: 'string',
};

// API
module.exports.submit = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const valid = validateRequest(requestBody, validationMatrix);
  if (valid.status === false) {
    let response = {message: valid.message};
    callback(null, apiResponse(500, response));
    return;
  }

  //Check if payment method is valid

  //Get the cart items
  let projection = "productId, amount";
  let attribute = {":userId": requestBody.userId};
  let condition = 'userId = :userId';
  Query(projection, attribute, condition, process.env.TRANSACTIONS).then(res => {
    if (res.Items.length === 0) {
      let response = {message: `Unable to list products, cart is empty`};
      callback(null, apiResponse(400, response));
      return;
    }
    let response = {cart: res.Items};
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to list of products`, error: err};
    callback(null, apiResponse(500, response))
  });


  Submit(itemInfo(requestBody, true), process.env.PRODUCTS).then(product => {
    let response = {message: `Sucessfully submitted invoice ${product.product}`, productId: product.id};
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to submit product`, error: err};
    callback(null, apiResponse(500, response))
  });
}

module.exports.list = (event, context, callback) => {
  let fields = "id, " + Object.keys(validationMatrix).join(", ")
  console.log(fields);
  List(fields, process.env.PRODUCTS).then(res => {
    let response = {products: res.Items};
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to list of products`, error: err};
    callback(null, apiResponse(500, response))
  });
};

module.exports.webhook = (event, context, callback) => {
  let fields = "id, " + Object.keys(validationMatrix).join(", ")
  console.log(fields);
  List(fields, process.env.PRODUCTS).then(res => {
    let response = {products: res.Items};
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to list of products`, error: err};
    callback(null, apiResponse(500, response))
  });
};
