'use strict';

const AWS = require('aws-sdk'); 
const { submitItem, litsItems, getItem, updateItem } = require('./dynamo');
const { validateRequest, apiResponse, userInfo, userUpdateInfo } = require('./utils');

AWS.config.setPromisesDependency(require('bluebird'));

const validationMatrix = {
  fullname: 'string',
  email: 'string',
};

// API
module.exports.submit = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const valid = validateRequest(requestBody, validationMatrix);
  console.log('Valid', valid);
  if (valid.status === false) {
    callback(null, apiResponse(500, valid.message));
    return;
  }
  submitItem(userInfo(requestBody), process.env.USERS).then(user => {
    console.log('User', user);
    let response = {message: `Sucessfully submitted candidate with email ${user.email}`, userId: user.id};
    callback(null, apiResponse(200, response));
  }).catch(err => {
    console.log('Error', err);
    let response = {message: `Unable to submit candidate with email ${user.email}`, error: err};
    callback(null, apiResponse(500, response))
  });
}

module.exports.list = (event, context, callback) => {
  let fields = "id, fullname, email"
  litsItems(fields, process.env.USERS).then(res => {
    let response = {users: res.Items};
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to list of users`, error: err};
    callback(null, apiResponse(500, response))
  });
};

module.exports.item = (event, context, callback) => {
  const id = event.pathParameters.id;
  const key = {id: id};
  getItem(key, process.env.USERS).then(res => {
    let response = res.Item;
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to list of users`, error: err};
    callback(null, apiResponse(500, response))
  });
};

module.exports.update = (event, context, callback) => {
  const id = event.pathParameters.id;
  const requestBody = JSON.parse(event.body);
  const valid = validateRequest(requestBody);
  if (valid.status === false) {
    callback(null, apiResponse(500, valid.message));
    return;
  }
  const key = {id: id};
  updateItem(key, userUpdateInfo(requestBody), process.env.USERS).then(user => {
    console.log('User', user);
    let response = {message: `Sucessfully updated candidate with email ${user.email}`, userId: user.id};
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to update candidate with email ${user.email}`, error: err};
    callback(null, apiResponse(500, response))
  });
}
