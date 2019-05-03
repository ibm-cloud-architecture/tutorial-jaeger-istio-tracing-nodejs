# Working with Istio

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
kubectl get ns app-rates -L istio-injection

NAME        STATUS   AGE   ISTIO-INJECTION
app-rates   Active   14m   enabled
```

Switch namespace context `app-rates`
```
kubens app-rates
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
kubectl pod describe myapp-v1-5d8d5f5496-wvjdf
```

To verify that the pod is accesible via service use port-forward
```
kubectl port-forward service/myapp 8080:8080
```
Open Browser or use curl to test the app
```
curl localhost:8080/rates
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

Set the INGRESS_HOST and INGRESS_PORT variables for accessing the gateway.
More options check [these instructions](https://istio.io/docs/tasks/traffic-management/ingress/#determining-the-ingress-ip-and-ports)

These assumes using IBM Kubernetes Service standard cluster:
Set the ingress host
```
export INGRESS_HOST=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
```
Set the ingress port
```
export INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].port}')
```
Set the `GATEWAY_URL`
```
export GATEWAY_URL=$INGRESS_HOST:$INGRESS_PORT
```

Confirm the App is accessible via `GATEWAY_URL` open a Browser or use `curl`
```
curl http://${GATEWAY_URL}/rates
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
while true; do curl -H "X-B3-Sampled:1" http://${GATEWAY_URL}/rates -I -s | grep "HTTP/" ; sleep 0.1; done
```
Using hey:
```
hey -c 1 -z 5m -H "X-B3-Sampled:1" http://${GATEWAY_URL}/rates
```
Using the header `-H "X-B3-Sampled:1"` force the requests to be sampled
