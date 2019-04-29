# Cloud Native Distributing Tracing for Node.js

## Setup
Git clone this repo
```
git clone --depth 1 https://.../cloudnative-tracing cloudnative-tracing
```

Try the app locally
```
pushd app-rates
npm install
npm start
```
App starts and listens on port `http://localhost:8080`
Do `Ctrl+C` to close App

Build docker image
```
docker build app-rates -t app-rates
```

Run docker image and expose port 8080
```
docker run --rm -p 8080:8080 app-rates
```

Test rates API
```
curl http://localhost:8080/rates
```


### Client Libraries
There are many client libraries for opentracing, jaeger, and zipkin pickig the corrent ones can be a challenge
- OpenTracing
    - https://github.com/opentracing/opentracing-javascript (on npm `opentracing`)
    - https://opentracing.io/guides/javascript/
- OpenTracing Contrib
    - https://github.com/opentracing-contrib/javascript-express (on npm `express-opentracing`)
- Jaeger
    - https://github.com/jaegertracing/jaeger-client-node (on npm `jaeger-client`)
    - https://www.jaegertracing.io/docs/1.11/client-features/

Will be using the `jaeger-client` and using some code from `express-opentracing` but using this library as it has too much magic and we want to show the user what's going with the http requests and responses.


### Resources
- Core repo for the book Mastering Distributed Tracing by Yuri Shkuro https://github.com/PacktPublishing/Mastering-Distributed-Tracing
- OpenTracing Tutorial https://github.com/yurishkuro/opentracing-tutorial
