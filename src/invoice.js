'use strict';

const AWS = require('aws-sdk'); 
const axios = require('axios');

const { Submit, List, Get, Query, Delete } = require('./dynamo');
const { validateRequest, apiResponse, itemInfo, createInvoice } = require('./utils');

AWS.config.setPromisesDependency(require('bluebird'));

const validationMatrix = {
  userId: 'string',
  paymentMethod: 'string',
};

// API
module.exports.submit = async (event, context, callback) => {
  const body = JSON.parse(event.body);
  const paymentTable = process.env.CONFIG;
  const cartTable = process.env.TRANSACTIONS;
  const invoiceTable = process.env.INVOICES;

  //Validate request
  const valid = validateRequest(body, validationMatrix);
  if (valid.status === false) {
    let response = {message: valid.message};
    callback(null, apiResponse(500, response));
    return;
  }

  //Check if payment method exists
  let paymentMethod = await Get(
    {id: body.paymentMethod}, paymentTable
  );
  if (paymentMethod.Item === undefined) {
    let response = {message: `Payment method not found`};
    callback(null, apiResponse(400, response));
    return;
  }

  //Check if cart is empty
  let cart = await Query(
    "productId, amount", {":userId": body.userId}, 'userId = :userId', cartTable
  );
  if (cart.Items.length === 0) {
    let response = {message: `Unable to list products, cart is empty`};
    callback(null, apiResponse(400, response));
    return;
  }

  //Send request to payment platform
  try{
    // payment = await Submit(invoice, paymentTable);
    console.log('submitted payment');
  } catch(err) {
    let response = {message: `Unable to submit payment`, error: err};
    callback(null, apiResponse(400, response));
    return;
  }

  //Create invoice
  let invoice = await createInvoice(cart);
  invoice.paymentMethod = paymentMethod.Item.id;
  invoice.status = 'pending';
  invoice.userId = body.userId;
  invoice.paymentUrl = paymentMethod.Item.paymentUrl;
  invoice = itemInfo(invoice, false);
  console.log('complete invoice', invoice);
  let submitted;
  try{
    submitted = await Submit(invoice, invoiceTable);
    console.log('submitted invoice', submitted);
  } catch(err) {
    let response = {message: `Unable to submit invoice`, error: err};
    callback(null, apiResponse(400, response));
    return;
  }

  //Delete cart
  let empty;
  try{
    empty = cart.Items.map(async item => {
      return await Delete({userId: body.userId, productId: item.productId}, cartTable);
    });
    console.log('empty cart', empty);
  } catch(err) {
    let response = {message: `Unable to empty cart`, error: err};
    callback(null, apiResponse(400, response));
    return;
  }

  let response = {message: `Sucessfully submitted invoice`, invoice: submitted};
  callback(null, apiResponse(200, response));
};

module.exports.list = async (event, context, callback) => {
  const queryParameters = event.queryStringParameters;
  const invoiceTable = process.env.INVOICES;
  const userId = queryParameters.userId;

  //Check if userId is provided
  if (queryParameters.userId === undefined) {
    let response = {message: `Unable to list of products, userId is required`};
    callback(null, apiResponse(500, response));
    return;
  }

  //List invoices
  try{
    let invoices = await Query(
      'userId, #d, #i, #s, subtotal, vat, #t', 
      {":userId": userId}, 
      'userId = :userId', 
      invoiceTable,
      {"#d": "date", "#i": "items", "#s": "status", "#t": "total"}
    );
    if (invoices.Items.length === 0) {
      let response = {message: `Unable to list invoices, no invoices found`};
      callback(null, apiResponse(404, response));
      return;
    }
    let response = {invoices: invoices.Items};
    callback(null, apiResponse(200, response));
  } catch(err) {
    let response = {message: `Unable to list of invoices`, error: err};
    callback(null, apiResponse(500, response));
    return;
  }
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
