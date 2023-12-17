var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors')
const {decodeToken} = require('./middlewares')
const productRoute = require('./app/products/router')
const categoryRoute = require('./app/category/router')
const tagRoute = require('./app/tag/router')
const authRoute = require('./app/auth/router')
const deliveryRoute = require('./app/deliveryAddress/router')
const cartRoute  =require('./app/cart/router')
const orderRoute  =require('./app/order/router')
const invoiceRoute  =require('./app/invoice/router')


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(decodeToken())

app.use('/auth',authRoute)
app.use('/api',productRoute)
app.use('/api',categoryRoute)
app.use('/api',tagRoute)
app.use('/api',deliveryRoute)
app.use('/api',cartRoute)
app.use('/api',orderRoute)
app.use('/api',invoiceRoute)

app.use('/', function(req,res){
  res.render('index',{
    title: 'Studi Kasus Backend'
  })
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
