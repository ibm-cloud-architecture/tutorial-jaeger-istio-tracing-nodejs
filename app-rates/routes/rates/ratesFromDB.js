
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
function getRates() {
    return new Promise((resolve, reject) => {
        // simulating a 200ms delay from DB
        // response can't be faster than 200ms
        setTimeout(() => {
            resolve(rates)
        }, 200);
    })
}
module.exports = {
    getRates: getRates
}