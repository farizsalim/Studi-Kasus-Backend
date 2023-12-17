const mongoose = require('mongoose');
const {dbHost, dbPass, dbName, dbPort, dbUser} = require('../app/config');

mongoose.connect(`mongodb+srv://${dbUser}:${dbPass}@${dbHost}/${dbName}?authSource=admin`);
const db =  mongoose.connection;

module.exports = db;