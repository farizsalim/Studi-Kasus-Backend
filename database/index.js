const mongoose = require('mongoose');
const {dbURL} = require('../app/config');

mongoose.connect(dbURL);
const db =  mongoose.connection;

module.exports = db;