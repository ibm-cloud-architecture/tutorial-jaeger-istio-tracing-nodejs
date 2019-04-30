var express = require('express');
var router = express.Router();
var ratesDB = require('./ratesFromDB')

router.get('/', function (req, res, next) {
    // show how to do a Tag KV
    req.span.setTag("someTag", "some value")
    // show how to do a log in the span
    req.span.log({ event: 'proc_rates', message: 'this is a log message' })
    // show how to set a baggage item
    req.span.setBaggageItem("MemberID", "023");
    // show how to pass down the span parent context
    ratesDB.getRates(req.span.context()).then((rates) => {
        res.json(rates);
        next()
    })
});

module.exports = router;