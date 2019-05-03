
# Using Jaeger on Kubernetes

This instructions would only setup jaeger, and use a jaeger agent as side card doesn't include Istio, if you want to use Jaeger with Istio see the guide [istio.md](istio.md)

I strongly recommend installing `kubectx` and `kubens` from https://github.com/ahmetb/kubectx


Setup kubernetes on Docker for Mac or Minikube, pick one:

## Setup Kubernetes on Docker for Mac
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

## Setup Kubernetes on Minikube

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

## Deploy Jaeger on Kubernetes

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

## Deploy Node.js Application on Kubernetes

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
