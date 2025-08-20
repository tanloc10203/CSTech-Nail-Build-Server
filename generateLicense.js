const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Function to generate a new license key
function generateLicenseKey() {
  return crypto.randomBytes(16).toString('hex');
}

// Function to write the license key to the license.key file
function writeLicenseKeyToFile(key) {
  const filePath = path.resolve(__dirname, 'license.key');
  fs.writeFileSync(filePath, key, 'utf8');
  console.log(`License key saved to ${filePath}`);
}

// Generate a new license key and write it to the file
const newLicenseKey = generateLicenseKey();
writeLicenseKeyToFile(newLicenseKey);

console.log(`Generated License Key: ${newLicenseKey}`);
