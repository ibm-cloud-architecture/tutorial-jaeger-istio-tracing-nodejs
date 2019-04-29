var express = require('express');
var router = express.Router();
var ratesDB = require('./ratesFromDB')

var tracer = require('../../lib/tracing')('rates')

/* GET users listing. */
router.get('/', function (req, res, next) {
    const span = tracer.startSpan("get rates")
    ratesDB.getRates().then((rates) => {
        span.finish()
        res.json(rates);
    })
});

module.exports = router;