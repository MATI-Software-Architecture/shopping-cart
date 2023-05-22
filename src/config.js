'use strict';

const AWS = require('aws-sdk'); 
const { Submit, List, Get, Update } = require('./dynamo');
const { validateRequest, apiResponse, itemInfo, itemUpdateInfo } = require('./utils');

AWS.config.setPromisesDependency(require('bluebird'));

const validationMatrix = {
  id: 'string',
  paymentMethod: 'string',
  paymentUrl: 'string',
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

  Submit(itemInfo(requestBody, false), process.env.CONFIG).then(config => {
    let response = {message: `Sucessfully submitted config`, id: config.id};
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to submit config`, error: err};
    callback(null, apiResponse(500, response))
  });
}

module.exports.list = (event, context, callback) => {
  let fields = 'id, paymentMethod'
  List(fields, process.env.CONFIG).then(res => {
    let response = {config: res.Items};
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to list config`, error: err};
    callback(null, apiResponse(500, response))
  });
};