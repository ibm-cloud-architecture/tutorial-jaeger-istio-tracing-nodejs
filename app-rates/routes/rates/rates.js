var express = require('express');
var router = express.Router();

let rates = {
    items: [
        {
            id: "001",
            name: "honda civic",
            price: 100.00
        },
        {
            id: "002",
            name: "ford focus",
            price: 150.00
        }
    ]
}
/* GET users listing. */
router.get('/', function (req, res, next) {
    res.json(rates);
});

module.exports = router;