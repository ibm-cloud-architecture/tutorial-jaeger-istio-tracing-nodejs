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

