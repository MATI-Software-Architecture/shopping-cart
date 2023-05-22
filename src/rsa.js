'use strict';

const NodeRSA = require('node-rsa');

module.exports.verifySignature = (message, signature, privateKey) => {
  const key = new NodeRSA(privateKey);
  const isValid = key.verify(message, signature, 'utf8', 'base64');
  return isValid;
};

module.exports.signMessage = (message, publicKey) => {
  const key = new NodeRSA(publicKey);
  const signature = key.sign(message, 'base64', 'utf8');
  return signature;
};

module.exports.encryptMessage = (message, publicKey) => {
  const key = new NodeRSA(publicKey);
  const encrypted = key.encrypt(message, 'base64');
  return encrypted;
};

module.exports.decryptMessage = (message, privateKey) => {
  const key = new NodeRSA(privateKey);
  const decrypted = key.decrypt(message, 'utf8');
  return decrypted;
};

module.exports.generateKeys = () => {
  const key = new NodeRSA({b: 2048});
  const publicKey = key.exportKey('pkcs1-public-pem');
  const privateKey = key.exportKey('pkcs1-private-pem');
  return {publicKey, privateKey};
};
