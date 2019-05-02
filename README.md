# Cloud Native Distributing Tracing for Node.js

## Setup
Git clone this repo
```
git clone --depth 1 https://.../cloudnative-tracing cloudnative-tracing
```
Install nodejs 12.x, I recommend using [nvm](https://github.com/nvm-sh/nvm)
```
nvm install 12.1.0
nvm use 12.1.0
```

Try the app with VSCode Run Debug "Launch via NPM" task, it specifies runtimeVersion 12.1.0, for more information on Debug with NodeJS and runtime version see here https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_multi-version-support
Make sure you have nvm or nvs install and install the node version for example node v12.1.0

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
## Using Jaeger on Kubernetes

I strongly recommend installing `kubectx` and `kubens` from https://github.com/ahmetb/kubectx

Setup kubernetes on Docker for Mac or Minikube, pick one:

### Setup Kubernetes on Docker for Mac
*Using Docker for Mac (Edge) kubernetes v1.13*
1. Go to preferences, advance tab, and make sure you are using 4 CPU, 8 GB Mem
1. Go to preferences, kubernetes tab enable kubernetes and wait to be ready
1. Configure your `kubectl` to use the `docker-desktop` cluster context
   1. You can use `kubectx docker-desktop`

Check that `kubectl` is pointing to correct context
```
kubectl get nodes

NAME             STATUS   ROLES    AGE   VERSION
docker-desktop   Ready    master   73m   v1.13.0
```

### Setup Kubernetes on Minkube
## Minikube

Install Minikube from here https://github.com/kubernetes/minikube/releases
I used minikube v1.0.1 and VirtualBox Version 5.2.28 r130011 (Qt5.6.3)
```
curl -Lo minikube https://storage.googleapis.com/minikube/releases/v1.0.1/minikube-darwin-amd64 && chmod +x minikube && sudo cp minikube /usr/local/bin/ && rm minikube
```

TLDR;
```
minikube delete
minikube config set kubernetes-version v1.14.1
minikube config set cpus 4
minikube config set memory 8192
minikube config set WantUpdateNotification false
minikube start --extra-config=apiserver.enable-admission-plugins="LimitRanger,NamespaceExists,NamespaceLifecycle,ResourceQuota,ServiceAccount,DefaultStorageClass,MutatingAdmissionWebhook"
minikube ssh -- sudo ip link set docker0 promisc on
```
Check that `kubectl` is pointing to correct context
```
kubectl get nodes

NAME       STATUS   ROLES    AGE   VERSION
minikube   Ready    master   16m   v1.14.1
```

### Deploy Jaeger on Kubernetes

*Deploy using Jaeger Operator:*

Follow the instructions here https://github.com/jaegertracing/jaeger-operator#installing-the-operator

TLDR;
```
kubectl create namespace observability # (1)
kubectl create -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/crds/jaegertracing_v1_jaeger_crd.yaml # (2)
kubectl create -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/service_account.yaml
kubectl create -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/role.yaml
kubectl create -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/role_binding.yaml
kubectl create -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/operator.yaml
```

*Create Jeager Instance:*

Follow instructions here https://github.com/jaegertracing/jaeger-operator#creating-a-new-jaeger-instance

TLDR;
```
kubectl apply -f kubernetes/jaeger/simplest.yaml
```

Expose the Jaeger frontend UI on localhost
```
kubectl port-forward svc/simplest-query 16686:16686
```

### Deploy Node.js Application on Kubernetes

Tag and Push the docker container for the node.js app using a registry namespace/user
```
docker tag app-rates -t ${DOCKER_USERNAME}/app-rates
docker push ${DOCKER_USERNAME}/app-rates
```

Edit the file [kubernetes/jaeger/my-app.yaml](./kubernetes/jaeger/my-app.yaml) with your image name
Deploy using `kubectl`
```
kubectl apply -f kubernetes/jaeger/my-app.yaml
```

Expose the Node.js App on localhost
```
kubectl port-forward deployment/myapp-deployment 8080:8080
```

## Test the Application
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
- OpenTracing API Documentation https://doc.esdoc.org/github.com/opentracing/opentracing-javascript/identifiers.html

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