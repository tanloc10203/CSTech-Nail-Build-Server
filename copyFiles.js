const fs = require('fs');
const path = require('path');

// Define the files to copy
const filesToCopy = ['package.json', '.production.env'];

// Define the destination directory
const destinationDir = path.resolve(__dirname, 'dist/src');

// Function to copy a file
const copyFile = (file) => {
  const source = path.resolve(__dirname, file);
  const destination = path.join(destinationDir, path.basename(file));

  fs.copyFile(source, destination, (err) => {
    if (err) {
      console.error(`Error copying ${file}:`, err);
    } else {
      console.log(`${file} copied to ${destination}`);
    }
  });
};

// Ensure the destination directory exists
if (!fs.existsSync(destinationDir)) {
  fs.mkdirSync(destinationDir, { recursive: true });
}

// Copy each file
filesToCopy.forEach(copyFile);
