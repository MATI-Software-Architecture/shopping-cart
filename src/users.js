'use strict';

const AWS = require('aws-sdk'); 
const { Submit, List, Get, Update } = require('./dynamo');
const { validateRequest, apiResponse, itemInfo, itemUpdateInfo } = require('./utils');

AWS.config.setPromisesDependency(require('bluebird'));

const validationMatrix = {
  fullname: 'string',
  email: 'string',
};

module.exports.submit = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const valid = validateRequest(requestBody, validationMatrix);
  if (valid.status === false) {
    let response = {message: valid.message};
    callback(null, apiResponse(500, response));
    return;
  }
  Submit(itemInfo(requestBody, true), process.env.USERS).then(user => {
    let response = {message: `Sucessfully submitted user with email ${user.email}`, userId: user.id};
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to submit user with email ${user.email}`, error: err};
    callback(null, apiResponse(500, response))
  });
}

module.exports.list = (event, context, callback) => {
  let fields = "id, " + Object.keys(validationMatrix).join(", ")
  List(fields, process.env.USERS).then(res => {
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
  Get(key, process.env.USERS).then(res => {
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
  const valid = validateRequest(requestBody, validationMatrix);
  if (valid.status === false) {
    callback(null, apiResponse(500, valid.message));
    return;
  }
  const key = {id: id};
  Update(key, itemUpdateInfo(requestBody), process.env.USERS).then(user => {
    let response = {message: `Sucessfully updated user with email ${user.email}`, userId: user.id};
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to update user with email ${user.email}`, error: err};
    callback(null, apiResponse(500, response))
  });
}
