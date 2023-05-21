'use strict';

const AWS = require('aws-sdk'); 

AWS.config.setPromisesDependency(require('bluebird'));
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.submitItem = async (item, TableName) => {
  const candidateInfo = {
    TableName: TableName,
    Item: item,
    ReturnValue: 'ALL_NEW',
  };
  const res = await dynamoDb.put(candidateInfo).promise();
  console.log('Dynamo response', res);
  return item;
};

module.exports.litsItems = async (fields, TableName) => {
  const userInfo = {
    TableName: TableName
  };
  if (fields) {
    userInfo.ProjectionExpression = fields;
  }
  const res = await dynamoDb.scan(userInfo).promise();
  console.log('Dynamo response', res);
  return res;
};

module.exports.getItem = async (key, TableName) => {
  const candidateInfo = {
    TableName: TableName,
    Key: key,
  };
  const res = await dynamoDb.get(candidateInfo).promise();
  console.log('Dynamo response', res);
  return res;
};

module.exports.updateItem = async (key, item, TableName) => {
  const candidateInfo = {
    TableName: TableName,
    Key: key,
    AttributeUpdates: item,
    ReturnValues: 'ALL_NEW',
  };
  const res = await dynamoDb.update(candidateInfo).promise();
  console.log('Dynamo response', res);
  return res.Attributes;
}
