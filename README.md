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

## Jaeger

### Using Jaeger locally with Docker
Will launch the two containers in docker, since they will share the same subnet the jaeger data should will be transported using the Jaeger Client using UDP (`jaeger:6832`)

Start Jaeger container
```
docker run --rm --name jaeger \
  -p 16686:16686 \
  jaegertracing/all-in-one:1.11 \
  --log-level=debug
```

Start the node.js app container with `--link jaeger` to link the hostname `jaeger` to the IP Address of the jaeger container, and pass the env variable `JAEGER_AGENT_HOST` to pass the hostname to the tracer
```
docker run --rm --name app-rates -it \
--link jaeger \
--env JAEGER_AGENT_HOST="jaeger" \
-p 8080:8080 \
app-rates
```
## Using Jaeger locally using Docker-Compose
Instead of running each docker seperately you can bring all containers at once using docker-compose

To start all containers
```
docker-compose up -d
```
To stop and remove containers
```
docker-compose down
```


Open the browser for the nodejs.app http://localhost:8080

Try the calling the API http://localhost:8080/rates a couple of times to report some traces

Now open a Browser to load the Frontend UI on http://localhost:16686 click search button

In the drop down select the Service `rates`

Click `Find Traces` at the bottom to find the traces

Select one of the traces to inspect the spans


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
- Repo for the book Mastering Distributed Tracing by Yuri Shkuro https://github.com/PacktPublishing/Mastering-Distributed-Tracing
- OpenTracing Tutorial https://github.com/yurishkuro/opentracing-tutorial
- OpenTracing AP Documentation https://doc.esdoc.org/github.com/opentracing/opentracing-javascript/identifiers.html

### Development Hacking
Instructions for developers doing work on this repo and making updates
You can start the jaeger container and expose ports on localhost for collection, and then run node.js app locally using node without a container

Start Jaeger container
```
docker run --rm --name jaeger \
  -p 6832:6832/udp \
  -p 16686:16686 \
  jaegertracing/all-in-one:1.11 \
  --log-level=debug
```

Start the Node.js app
```
cd app-rates && npm run debug
```