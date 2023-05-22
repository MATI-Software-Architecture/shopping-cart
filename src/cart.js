'use strict';

const AWS = require('aws-sdk'); 
const { Submit, Get, Update, Query, Delete } = require('./dynamo');
const { validateRequest, apiResponse, itemInfo, itemUpdateInfo, createInvoice } = require('./utils');

AWS.config.setPromisesDependency(require('bluebird'));

const validationMatrix = {
  userId: 'string',
  productId: 'string',
  amount: 'number'
};

// API
module.exports.add = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const valid = validateRequest(requestBody, validationMatrix);
  if (valid.status === false) {
    let response = {message: valid.message};
    callback(null, apiResponse(500, response));
    return;
  }

  let key = {id: requestBody.productId};
  Get(key, process.env.PRODUCTS).then(product => {
    if (product.Item.length === 0) {
      let response = {message: `Unable to add to cart, product not found`};
      callback(null, apiResponse(400, response));
      return;
    }
    if (product.Item.stock < requestBody.amount) {
      let response = {message: `Unable to add to cart, not enough stock`};
      callback(null, apiResponse(400, response));
      return;
    }
    let key = {id: requestBody.productId};
    let item = itemUpdateInfo({stock: product.Item.stock - requestBody.amount})
    return Update(key, item, process.env.PRODUCTS);
  }).then(product => {
    let projection = "userId, productId, amount";
    let attribute = {
      ":userId": requestBody.userId,
      ":productId": requestBody.productId,
    }
    let condition = 'userId = :userId AND productId = :productId';
    return Query(projection, attribute, condition, process.env.TRANSACTIONS);
  }).then(cart => {
    if (cart.Items.length === 0) {
      let item = itemInfo(requestBody, false);
      return Submit(item, process.env.TRANSACTIONS);
    } else {
      let key = {userId: requestBody.userId, productId: requestBody.productId};
      let item = itemUpdateInfo({amount: cart.Items[0].amount + requestBody.amount})
      return Update(key, item, process.env.TRANSACTIONS);
    }
  }).then(transaction => {
    let response = {message: `Sucessfully add to the cart`};
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to add to the cart`, error: err};
    callback(null, apiResponse(500, response))
  });
}

module.exports.remove = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const valid = validateRequest(requestBody, validationMatrix);
  if (valid.status === false) {
    let response = {message: valid.message};
    callback(null, apiResponse(500, response));
    return;
  }

  let key = {userId: requestBody.userId, productId: requestBody.productId};
  Get(key, process.env.TRANSACTIONS).then(cart => {
    if (cart.Item === undefined) {
      let response = {message: `Unable to remove from cart, product not found`};
      callback(null, apiResponse(400, response));
      return;
    }
    if (cart.Item.amount > requestBody.amount) {
      let key = {userId: requestBody.userId, productId: requestBody.productId};
      let item = itemUpdateInfo({amount: cart.Item.amount - requestBody.amount})
      return Update(key, item, process.env.TRANSACTIONS);
    } else {
      if (cart.Item.amount < requestBody.amount) {
        requestBody.amount = cart.Item.amount;
      }
      let key = {userId: requestBody.userId, productId: requestBody.productId};
      return Delete(key, process.env.TRANSACTIONS);
    }
  }).then(transaction => {
    let key = {id: requestBody.productId};
    return Get(key, process.env.PRODUCTS);
  }).then(product => {
    let key = {id: requestBody.productId};
    let item = itemUpdateInfo({stock: product.Item.stock + requestBody.amount})
    return Update(key, item, process.env.PRODUCTS);
  }).then(transaction => {
    let response = {message: `Sucessfully remove to the cart`};
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to remove to the cart`, error: err};
    callback(null, apiResponse(500, response))
  });
}

module.exports.list = (event, context, callback) => {
  const queryParameters = event.queryStringParameters;
  const cartTable = process.env.TRANSACTIONS;
  if (queryParameters.userId === undefined) {
    let response = {message: `Unable to list of products, userId is required`};
    callback(null, apiResponse(500, response));
    return;
  }

  let projection = "productId, amount";
  let attribute = {":userId": queryParameters.userId};
  let condition = 'userId = :userId';
  Query(projection, attribute, condition, cartTable).then(async cart => {
    let response = await createInvoice(cart);
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to list of products`, error: err};
    callback(null, apiResponse(500, response))
  });
};
