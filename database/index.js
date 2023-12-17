const mongoose = require('mongoose');
const {dbHost, dbPass, dbName, dbPort, dbUser} = require('../app/config');

mongoose.connect(`mongodb://test:fariz1009@0.0.0.0:27017/?authSource=admin`);
const db =  mongoose.connection;

module.exports = db;