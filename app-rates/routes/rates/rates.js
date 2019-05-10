var express = require('express');
var router = express.Router();
var ratesDB = require('./ratesFromDB');

const hostname = process.env.HOSTNAME || 'localhost';

requestHandler = function (req, res, next) {
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
        rates.hostname = hostname;
        res.json(rates);
        next()
    }).catch((err) => {
        res.status(500).send({ error: err.message });
    });
}

router.use('/', requestHandler);

module.exports = router;