var express = require('express');
var router = express.Router();
var ratesDB = require('./ratesFromDB');

router.get('/', function (req, res, next) {
    // show how to do a Tag KV
    let memberid = req.query.memberid || "0000";
    const ctx = req;
    ctx.span.setTag("someTag", "some value");
    // show how to do a log in the span
    ctx.span.log({ event: 'proc_rates', message: `this is a log message for memberid ${memberid}` });
    // show how to set a baggage item
    ctx.span.setBaggageItem("memberid", memberid);
    // show how to pass down the span parent context
    ratesDB.getRates(ctx).then((rates) => {
        res.json(rates);
        next()
    });
});

module.exports = router;