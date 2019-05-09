var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var ratesRouter = require('./routes/rates/rates');

var tracingMiddleware = require("./lib/tracing-middleware");



var app = express();


app.use(tracingMiddleware());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/car-rates', ratesRouter);

module.exports = app;
