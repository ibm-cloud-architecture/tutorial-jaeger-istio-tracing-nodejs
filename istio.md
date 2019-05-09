# Distributing Tracing using Istio and Jaeger

## Get Istio installed

- IKS
If you are using IBM Kubernetes Service (IKS) you can add the Istio Add-on
- Minkube
Install Istio on Minikube following this Guide [minikube](minikube.md)

## Set the GATEWAY_URL
Using LoadBalancer:
```
export INGRESS_HOST=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
export INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].port}')
export GATEWAY_URL=$INGRESS_HOST:$INGRESS_PORT
echo GATEWAY_URL=$GATEWAY_URL
```

## Deploy the App with Istio

Create a new namespace `app-rates`
```
kubectl create ns app-rates
```

Add label istio injection
```
kubectl label namespace app-rates istio-injection=enabled
```

Verify labels
```
kubectl get ns -L istio-injection

NAME        STATUS   AGE   ISTIO-INJECTION
app-rates   Active   14m   enabled
```

Switch namespace context `app-rates`
```
kubens app-rates
```

Build the container, using minikube you can build the container locally
```
eval $(minikube docker-env)
docker build app-rates -t app-rates
```

Deploy the app and services
```
kubectl apply -f kubernetes/istio/my-app.yaml
```

Confirm all services and pods are correctly defined and running:
```
kubectl get services

NAME    TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
myapp   ClusterIP   172.21.131.120   <none>        8080/TCP   42s
```
Check the pods:
```
kubectl get pods

NAME                        READY   STATUS    RESTARTS   AGE
myapp-v1-5d8d5f5496-wvjdf   2/2     Running   0          6m22s
```
Check that the sidecard container is injected and that two containers are running
```
kubectl describe pod -l app=myapp
```

To verify that the pod is accesible via service use port-forward
```
kubectl port-forward service/myapp-svc 8080:8080
```
Open Browser or use curl to test the app
```
curl localhost:8080/car-rates
```

Let's create the Istio Gateway and VirtualService to make the service accessible from outside of your Kubernetes cluster
```
kubectl apply -f kubernetes/istio/networking.yaml
```

Confirm gateway is created
```
kubectl get gateway

NAME            AGE
myapp-gateway   2m
```

Confirm Virtual Service is running
```
kubectl get virtualservice

NAME    GATEWAYS          HOSTS   AGE
myapp   [myapp-gateway]   [*]     3m
```

Confirm the App is accessible via `GATEWAY_URL` open a Browser or use `curl`
```
export APP_URL=http://$GATEWAY_URL/car-rates
echo APP_URL=$APP_URL
echo open $APP_URL
curl -s $APP_URL -I -s | grep "HTTP/"
```
output:
```
HTTP/OK 200
```

Open Grafana
```
kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=grafana -o jsonpath='{.items[0].metadata.name}') 3000:3000
```
open http://localhost:3000/dashboard/db/istio-mesh-dashboard

Open Prometheus UI
```
kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=prometheus -o jsonpath='{.items[0].metadata.name}') 9090:9090

```
open http://localhost:9090/graph


Open Jaeger
```
kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=jaeger -o jsonpath='{.items[0].metadata.name}') 16686:16686
```
open http://localhost:16686/

Open Kiali
```
kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=kiali -o jsonpath='{.items[0].metadata.name}') 20001:20001
```
open http://localhost:20001/kiali/console

Use `admin` and `admin` for username and password

Drive some load for testing
You can use curl or hey tool
Using curl
```
while true; do curl  http://$GATEWAY_URL/car-rates -I -s | grep "HTTP/" ; sleep 0.1; done
```
Using hey:
```
hey -c 10 -z 5m  http://$GATEWAY_URL/car-rates
```
Using the header `-H "X-B3-Sampled:1"` force the requests to be sampled

Now go to Grafana, Jaeger, and Kiali and inspect the trafic and the tracing data colleced.

### (Optional) Install Wave Scope
To install wave scope see instructions here: https://www.weave.works/docs/scope/latest/installing/#kubernetes-local-clone

TLDR;
```
git clone https://github.com/weaveworks/scope
cd scope
kubectl apply -f examples/k8s
```

Open Wave Scope
```
kubectl port-forward svc/weave-scope-app -n weave 4040:80
```
open http://localhost:4040/



## Clean up

You can remove the namespace label to avoid side card injection for istio
```
kubectl label namespace app-rates istio-injection-
```