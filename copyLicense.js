const fs = require('fs');
const path = require('path');

const source = path.resolve(__dirname, 'license.key');
const destination = path.resolve(__dirname, 'dist/src', 'license.key');

fs.copyFile(source, destination, (err) => {
  if (err) {
    console.error('Error copying license.key:', err);
  } else {
    console.log('license.key copied to dist/src directory');
  }
});
