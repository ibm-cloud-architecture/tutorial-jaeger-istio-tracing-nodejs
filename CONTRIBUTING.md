# Contributing

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

You can use VSCode debug task `Launch via NPM` or start the Node.js app
from command line using `npm run debug`
```
cd app-rates && npm run debug
```