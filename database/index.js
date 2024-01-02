const mongoose = require('mongoose');
const {dbHost, dbPass, dbName, dbPort, dbUser} = require('../app/config');

mongoose.connect(`mongodb+srv://adaw2216:fariz1009@cluster0.q96ymty.mongodb.net/?authSource=admin`);
const db =  mongoose.connection;

module.exports = db;