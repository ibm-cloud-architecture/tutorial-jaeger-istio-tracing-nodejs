var express = require('express');
var router = express.Router();
var ratesDB = require('./ratesFromDB')

/* GET users listing. */
router.get('/', function (req, res, next) {
    ratesDB.getRates().then((rates) => {
        res.json(rates);
    })
});

module.exports = router;