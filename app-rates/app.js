var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var ratesRouter = require('./routes/rates/rates');

var tracingMiddleware = require("./lib/tracing-middleware");
var tracer = require('./lib/tracing')('rates-service')
var opentracing = require("opentracing")

var app = express();

// initialize tracing into expressjs
opentracing.initGlobalTracer(tracer);
app.use(tracingMiddleware());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/rates', ratesRouter);

module.exports = app;
