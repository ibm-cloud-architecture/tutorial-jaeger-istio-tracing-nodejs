// original code from https://github.com/opentracing-contrib/javascript-express/blob/master/src/middleware.js

var opentracing = require("opentracing");
var url = require("url");

function middleware(options = {}) {
    const tracer = options.tracer || opentracing.globalTracer();

    return (req, res, next) => {
        const wireCtx = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, req.headers);
        const pathname = url.parse(req.url).pathname;
        const span = tracer.startSpan(pathname, { childOf: wireCtx });
        span.log({ 'event': 'request_received' });

        // include some useful tags on the trace
        span.setTag(opentracing.Tags.HTTP_METHOD, req.method);
        span.setTag(opentracing.Tags.SPAN_KIND, opentracing.Tags.SPAN_KIND_RPC_SERVER);
        span.setTag(opentracing.Tags.HTTP_URL, req.url);

        // include trace ID in headers so that we can debug slow requests we see in
        // the browser by looking up the trace ID found in response headers
        //const responseHeaders = {};
        //tracer.inject(span, opentracing.FORMAT_TEXT_MAP, responseHeaders);
        //Object.keys(responseHeaders).forEach(key => res.setHeader(key, responseHeaders[key]));

        // add the span to the request object for handlers to use
        Object.assign(req, { span });

        // finalize the span when the response is completed
        const finishSpan = () => {

            // Route matching often happens after the middleware is run. Try changing the operation name
            // to the route matcher.
            //const opName = (req.route && req.route.path) || pathname;
            //span.setOperationName(opName);
            span.setTag(opentracing.Tags.HTTP_STATUS_CODE, res.statusCode);
            if (res.statusCode >= 500) {
                span.setTag(opentracing.Tags.ERROR, true);
                span.setTag(opentracing.Tags.SAMPLING_PRIORITY, 1);
                span.log({ 'event': 'error', 'message': res.statusMessage });
            }
            span.log({ 'event': 'request_end' });
            span.finish();
        };
        //res.on('close', finishSpan);
        res.on('finish', finishSpan);

        next();
    };
}
module.exports = middleware;