'use strict';

const AWS = require('aws-sdk'); 
const { Submit, List, Get, Update } = require('./dynamo');
const { validateRequest, apiResponse, itemInfo, itemUpdateInfo } = require('./utils');

AWS.config.setPromisesDependency(require('bluebird'));

const validationMatrix = {
  product: 'string',
  brand: 'string',
  price: 'number',
  stock: 'number',
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
  Submit(itemInfo(requestBody, true), process.env.PRODUCTS).then(product => {
    let response = {message: `Sucessfully submitted product ${product.product}`, productId: product.id};
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

module.exports.item = (event, context, callback) => {
  const id = event.pathParameters.id;
  const key = {id: id};
  Get(key, process.env.PRODUCTS).then(res => {
    let response = res.Item;
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to list of products`, error: err};
    callback(null, apiResponse(500, response))
  });
};

module.exports.update = (event, context, callback) => {
  const id = event.pathParameters.id;
  const requestBody = JSON.parse(event.body);
  const valid = validateRequest(requestBody, validationMatrix);
  if (valid.status === false) {
    callback(null, apiResponse(500, valid.message));
    return;
  }
  const key = {id: id};
  Update(key, itemUpdateInfo(requestBody), process.env.PRODUCTS).then(product => {
    let response = {message: `Sucessfully updated product ${product.product}`, productId: product.id};
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to update product`, error: err};
    callback(null, apiResponse(500, response))
  });
}
