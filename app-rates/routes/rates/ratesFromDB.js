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
const CloudantURL = process.env.CLOUDANT_URL;
const CloudantDB = process.env.CLOUDANT_DB;
var getRates = getRatesLocal;
if (CloudantURL) {
    getRates = getRatesCloudant;
    var Cloudant = require('@cloudant/cloudant');
    var cloudant = Cloudant(CloudantURL);
    var db = cloudant.use(CloudantDB);
}

function getRatesLocal(ctx) {
    // getting the global tracer
    const tracer = opentracing.globalTracer();
    // show how to start new child span
    ctx = {
        span: tracer.startSpan("ratesfromdb", { childOf: ctx.span })
    };
    //    const span = tracer.startSpan("ratesfromdb", { childOf: ctx.span })
    return new Promise((resolve, reject) => {
        // simulating a 200ms delay from DB
        // response can't be faster than 200ms
        setTimeout(() => {
            ctx.span.finish()
            resolve(rates)
        }, 200);
    })
}

function getRatesCloudant(ctx) {
    // getting the global tracer
    const tracer = opentracing.globalTracer();
    // show how to start new child span
    ctx = {
        span: tracer.startSpan("ratesfromCloudantdb", { childOf: ctx.span })
    };

    //    const span = tracer.startSpan("ratesfromdb", { childOf: ctx.span })
    return new Promise((resolve, reject) => {
        db.list({ include_docs: true }).then((body) => {
            var rates = {};
            rates.items = []
            body.rows.forEach((doc) => {
                // output eacj document's body
                rates.items.push({
                    id: doc.doc.id,
                    name: doc.doc.name,
                    weekly: doc.doc.weekly,
                    daily: doc.doc.daily
                })
            });
            resolve(rates)
        }).catch((err) => {
            reject(err)
        });
    })
}
function getRatesCloudantRequest(req) {
    // getting the global tracer
    const tracer = opentracing.globalTracer();
    // show how to start new child span
    ctx = {
        span: tracer.startSpan("ratesfromCloudantdb", { childOf: req.span })
    };

    //    const span = tracer.startSpan("ratesfromdb", { childOf: ctx.span })
    return new Promise((resolve, reject) => {
        cloudant.request({
            db: CloudantDB,
            path: '_all_docs',
            qs: {
                include_docs: true
            },
            headers: forwardHeaders(req)
        }).then((body) => {
            var rates = {};
            rates.items = []
            body.rows.forEach((doc) => {
                rates.items.push({
                    id: doc.doc.id,
                    name: doc.doc.name,
                    weekly: doc.doc.weekly,
                    daily: doc.doc.daily
                })
            });
            resolve(rates)
        }).catch((err) => {
            reject(err)
        });
    })
}

function forwardHeaders(req) {
    let headers = {};
    let incomingHeaders = ['x-request-id', 'x-b3-traceid', 'x-b3-spanid', 'x-b3-parentspanid', 'x-b3-sampled', 'x-b3-flags', 'x-ot-span-context'];
    incomingHeaders.forEach((key) => {
        let val = req.get(key)
        if (val) {
            headers[key] = val;
        }
    })
    console.debug('forwarding headers to cloudant', headers)
    return headers;
}

module.exports = {
    getRates: getRates
}