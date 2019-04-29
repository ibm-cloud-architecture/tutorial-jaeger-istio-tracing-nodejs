
// Need to use initTracerFromEnv instead of initTracer to pick up config from env variabl
var initJaegerTracer = require("jaeger-client").initTracerFromEnv;

function initTracer(serviceName) {
    var config = {
        serviceName: serviceName,
        sampler: {
            type: "const",
            param: 1,
        },
        reporter: {
            logSpans: true,
        },
    };
    var options = {
        logger: {
            info: function logInfo(msg) {
                console.log("INFO ", msg);
            },
            error: function logError(msg) {
                console.log("ERROR", msg);
            },
        },
    };
    return initJaegerTracer(config, options);
}
module.exports = initTracer;