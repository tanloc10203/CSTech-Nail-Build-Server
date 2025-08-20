#!/bin/bash
echo "Checking for Node.js..."
if ! command -v node &> /dev/null
then
    echo "Node.js not found. Installing Node.js..."
    curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js is already installed."
fi

echo "Checking for MongoDB..."
if ! command -v mongod &> /dev/null
then
    echo "MongoDB not found. Installing MongoDB..."
    wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
    sudo apt-get install -y mongodb
else
    echo "MongoDB is already installed."
fi

echo "Installing application dependencies..."
npm install --production

echo "Starting the application..."
node dist/main.js
