'use strict';

const uuid = require('uuid');

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

module.exports.itemInfo = (requestBody) => {
  const timestamp = new Date().getTime();
  requestBody['id'] = uuid.v1();
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
