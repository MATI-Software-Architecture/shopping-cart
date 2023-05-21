'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk'); 

AWS.config.setPromisesDependency(require('bluebird'));
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// API
module.exports.submit = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const fullname = requestBody.fullname;
  const email = requestBody.email;

  if (typeof fullname !== 'string' || typeof email !== 'string') {
    let response = {message: `Invalid input. fullname and email must be strings.`};
    callback(null, apiResponse(500, response));
    return;
  }
  submitItem(userInfo(requestBody), process.env.USERS).then(user => {
    let response = {message: `Sucessfully submitted candidate with email ${email}`, userId: user.id};
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to submit candidate with email ${email}`, error: err};
    callback(null, apiResponse(500, response))
  });
}

module.exports.list = (event, context, callback) => {
  let fields = "id, fullname, email"
  litsItems(process.env.USERS, fields).then(res => {
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
  litsItems(process.env.USERS, null, key).then(res => {
    let response = {user: res.Items[0]};
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to list of users`, error: err};
    callback(null, apiResponse(500, response))
  });
};

module.exports.update = (event, context, callback) => {
  const id = event.pathParameters.id;
  const requestBody = JSON.parse(event.body);
  const fullname = requestBody.fullname;
  const email = requestBody.email;

  if (typeof fullname !== 'string' || typeof email !== 'string') {
    let response = {message: `Invalid input. fullname and email must be strings.`};
    callback(null, apiResponse(500, response));
    return;
  }
  const key = {id: id};
  updateItem(key, userUpdateInfo(requestBody), process.env.USERS).then(user => {
    let response = {message: `Sucessfully updated candidate with email ${email}`, userId: user.id};
    callback(null, apiResponse(200, response));
  }).catch(err => {
    let response = {message: `Unable to update candidate with email ${email}`, error: err};
    callback(null, apiResponse(500, response))
  });
}

// Helpers
const apiResponse = (statusCode, body) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json'
    }
  };
};

const userInfo = (requestBody) => {
  const timestamp = new Date().getTime();
  requestBody['id'] = uuid.v1();
  requestBody['submittedAt'] = timestamp;
  requestBody['updatedAt'] = timestamp;
  return requestBody;
};

const userUpdateInfo = (requestBody) => {
  const timestamp = new Date().getTime();
  for (let key in requestBody) {
    requestBody[key] = {Value: requestBody[key], Action: 'PUT'};
  }
  requestBody['updatedAt'] = {Value: timestamp, Action: 'PUT'};
  return requestBody;
};

// DynamoDB
const submitItem = async (item, TableName) => {
  const candidateInfo = {
    TableName: TableName,
    Item: item,
  };
  const res = await dynamoDb.put(candidateInfo).promise();
  console.log('Dynamo response', res);
  return item;
};

const litsItems = async (TableName, fields, key) => {
  const userInfo = {
    TableName: TableName
  };
  if (fields) {
    userInfo.ProjectionExpression = fields;
  }
  if (key) {
    userInfo.Key = key;
  }
  const res = await dynamoDb.scan(userInfo).promise();
  console.log('Dynamo response', res);
  return res;
};

const updateItem = async (key, item, TableName) => {
  const candidateInfo = {
    TableName: TableName,
    Key: key,
    AttributeUpdates: item,
    ReturnValues: 'ALL_NEW',
  };
  const res = await dynamoDb.update(candidateInfo).promise();
  console.log('Dynamo response', res);
  return item;
}
