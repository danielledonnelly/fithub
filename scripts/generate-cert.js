const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, {
  algorithm: 'sha256',
  days: 365,
  keySize: 2048,
});

fs.writeFileSync(path.join(__dirname, '..', 'cert.pem'), pems.cert);
fs.writeFileSync(path.join(__dirname, '..', 'key.pem'), pems.private);

console.log('Generated cert.pem and key.pem files successfully!'); 