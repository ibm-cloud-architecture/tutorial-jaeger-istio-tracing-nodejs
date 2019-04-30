var opentracing = require("opentracing")

let rates = {
    items: [
        {
            id: "001",
            name: "car 1",
            weekly: 100.59,
            daily: 20.19,
        },
        {
            id: "002",
            name: "car 2",
            weekly: 150.99,
            daily: 40.99,
        }
    ]
}
function getRates(ctx) {
    // getting the global tracer
    const tracer = opentracing.globalTracer();
    // show how to start new child span
    const span = tracer.startSpan("ratesfromdb", { childOf: ctx })
    return new Promise((resolve, reject) => {
        // simulating a 200ms delay from DB
        // response can't be faster than 200ms
        setTimeout(() => {
            span.finish()
            resolve(rates)
        }, 200);
    })
}
module.exports = {
    getRates: getRates
}