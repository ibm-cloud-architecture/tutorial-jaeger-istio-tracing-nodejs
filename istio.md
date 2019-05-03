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
kubectl get ns -L istio-injection

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
kubectl describe pod myapp-v1-5d8d5f5496-wvjdf
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

### Setting up minikube for Istio

If you have Docker for Desktop you might want to close the application as you will need memory for your Minikube VM

Install Minikube from here https://github.com/kubernetes/minikube/releases
I used minikube v1.0.1 and VirtualBox Version 5.2.28 r130011 (Qt5.6.3)
```
curl -Lo minikube https://storage.googleapis.com/minikube/releases/v1.0.1/minikube-darwin-amd64 && chmod +x minikube && sudo cp minikube /usr/local/bin/ && rm minikube
```


Setup Minikube
```
minikube delete
minikube config set kubernetes-version v1.14.1
minikube config set cpus 4
minikube config set memory 8192
minikube config set WantUpdateNotification false
minikube start --extra-config=apiserver.enable-admission-plugins="LimitRanger,NamespaceExists,NamespaceLifecycle,ResourceQuota,ServiceAccount,DefaultStorageClass,MutatingAdmissionWebhook"
```

Check that `kubectl` is pointing to correct context using `kubectx minikube`
```
kubectl get nodes

NAME       STATUS   ROLES    AGE   VERSION
minikube   Ready    master   16m   v1.14.1
```

Run minkube in a new terminal with [Load Balancer](https://github.com/kubernetes/minikube/blob/master/docs/tunnel.md)
```
minikube tunnel
```

Download istio to a directory in my case using same version as IKS `1.1.2`
https://github.com/istio/istio/releases/tag/1.1.2
```
pushd istio-1.1.2/
export PATH=$PWD/bin:$PATH
```
Install the Istio CRDS
```
for i in install/kubernetes/helm/istio-init/files/crd*yaml; do kubectl apply -f $i; done
```

Instal a simple istio deployment
If not using `minikube tunnel` as LoadBalancer, then edit `istio-demo.yaml` and replace `LoadBalancer` for `NodePort`
```
kubectl apply -f install/kubernetes/istio-demo.yaml
```

Check that all pods come up and Running
```
watch kubectl get pods -n istio-system
```

All pods should be `Runnin` or `Completed` in about 10 minutes
```
NAME                                      READY   STATUS      RESTARTS   AGE
grafana-7b9f5d484f-hnwnd                  1/1     Running     0          5m59s
istio-citadel-678b7c5cd4-9spdp            1/1     Running     0          5m59s
istio-cleanup-secrets-1.1.2-z2sbj         0/1     Completed   0          6m1s
istio-egressgateway-76df57d595-f6575      1/1     Running     0          5m59s
istio-galley-74c6547b94-dkpt6             1/1     Running     0          5m59s
istio-grafana-post-install-1.1.2-xtshx    0/1     Completed   0          6m2s
istio-ingressgateway-96898859b-6h9nm      1/1     Running     0          5m59s
istio-pilot-7f74894999-665fd              2/2     Running     0          5m59s
istio-policy-7dbcc47689-l5b6n             2/2     Running     6          5m59s
istio-security-post-install-1.1.2-86bcs   0/1     Completed   0          6m1s
istio-sidecar-injector-c8459bd4f-z4dmm    1/1     Running     0          5m59s
istio-telemetry-b5685c7f9-hdpbl           2/2     Running     6          5m59s
istio-tracing-7f5d8c5d98-xkj2x            1/1     Running     0          5m58s
kiali-589d55b4db-rz48q                    1/1     Running     0          5m59s
prometheus-878999949-f99bw                1/1     Running     0          5m59s
```

Ensure the following Kubernetes services are deployed and verify they all have an appropriate `CLUSTER-IP` except the jaeger-agent service:
```
kubectl get svc -n istio-system
```
output
```
NAME                     TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                                                                                                      AGE
grafana                  ClusterIP      10.99.155.163    <none>        3000/TCP                                                                                                                                     6m40s
istio-citadel            ClusterIP      10.108.68.145    <none>        8060/TCP,15014/TCP                                                                                                                           6m40s
istio-egressgateway      ClusterIP      10.97.251.84     <none>        80/TCP,443/TCP,15443/TCP                                                                                                                     6m41s
istio-galley             ClusterIP      10.99.107.161    <none>        443/TCP,15014/TCP,9901/TCP                                                                                                                   6m41s
istio-ingressgateway     LoadBalancer   10.108.235.250   <pending>     80:31380/TCP,443:31390/TCP,31400:31400/TCP,15029:30401/TCP,15030:30927/TCP,15031:31365/TCP,15032:31038/TCP,15443:32685/TCP,15020:30124/TCP   6m41s
istio-pilot              ClusterIP      10.101.212.170   <none>        15010/TCP,15011/TCP,8080/TCP,15014/TCP                                                                                                       6m40s
istio-policy             ClusterIP      10.102.135.15    <none>        9091/TCP,15004/TCP,15014/TCP                                                                                                                 6m40s
istio-sidecar-injector   ClusterIP      10.100.240.188   <none>        443/TCP                                                                                                                                      6m40s
istio-telemetry          ClusterIP      10.110.46.219    <none>        9091/TCP,15004/TCP,15014/TCP,42422/TCP                                                                                                       6m40s
jaeger-agent             ClusterIP      None             <none>        5775/UDP,6831/UDP,6832/UDP                                                                                                                   6m38s
jaeger-collector         ClusterIP      10.102.245.66    <none>        14267/TCP,14268/TCP                                                                                                                          6m38s
jaeger-query             ClusterIP      10.105.6.158     <none>        16686/TCP                                                                                                                                    6m38s
kiali                    ClusterIP      10.100.239.49    <none>        20001/TCP                                                                                                                                    6m40s
prometheus               ClusterIP      10.99.35.114     <none>        9090/TCP                                                                                                                                     6m40s
tracing                  ClusterIP      10.97.114.231    <none>        80/TCP                                                                                                                                       6m38s
zipkin                   ClusterIP      10.99.93.113     <none>        9411/TCP
```
If using `minikube tunnel` then the service `istio-ingressgateway` should have `LoadBalancer` under `Type`.

If not using `minikube tunnel` then the EXTERNAL-IP of `istio-ingressgateway` will say `<pending>`. To access the gateway, use the service’s `NodePort`, or use port-forwarding instead.

You can open the dashboard
```
minikube dashboard
```

Add the label to inject on the namespace for auto injection
```
kubectl label namespace default istio-injection=enabled
```
Verify the label
```
kubectl get ns -L istio-injection
```
output
```
NAME              STATUS   AGE     ISTIO-INJECTION
default           Active   3h48m   enabled
```

Make sure you are in the correct namespace by default using `kubens default`

Install [Bookinfo App](https://istio.io/docs/examples/bookinfo/) to verify the installation
```
kubectl apply -f samples/bookinfo/platform/kube/bookinfo.yaml
```

Verify the App created all the resources and is running
```
kubectl get services
```
output
```
NAME          TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
details       ClusterIP   10.97.211.27     <none>        9080/TCP   95s
kubernetes    ClusterIP   10.96.0.1        <none>        443/TCP    3h51m
productpage   ClusterIP   10.99.188.92     <none>        9080/TCP   95s
ratings       ClusterIP   10.105.171.101   <none>        9080/TCP   95s
reviews       ClusterIP   10.96.70.176     <none>        9080/TCP   95s
```
and
```
kubectl get pods
```
output
```
NAME                             READY   STATUS    RESTARTS   AGE
details-v1-79c6548b59-59j6m      2/2     Running   0          4m4s
productpage-v1-95d579cd5-zkp4d   2/2     Running   0          4m4s
ratings-v1-7665579b75-msxhv      2/2     Running   0          4m4s
reviews-v1-67446f7d9b-npprd      2/2     Running   0          4m4s
reviews-v2-6bc7b4f678-gksjv      2/2     Running   0          4m4s
reviews-v3-59b5b6948-j4prd       2/2     Running   0          4m4s
```
Check that app is running
```
kubectl exec -it $(kubectl get pod -l app=ratings -o jsonpath='{.items[0].metadata.name}') -c ratings -- curl productpage:9080/productpage | grep -o "<title>.*</title>"
```
output:
```
<title>Simple Bookstore App</title>
```

Now let's setup the Gateway and VirtualService
```
kubectl apply -f samples/bookinfo/networking/bookinfo-gateway.yaml
```
Verify the resources created
```
kubectl get gateway
```
output:
```
NAME               AGE
bookinfo-gateway   19s
```
```
kubectl get virtualservice
```
output:
```
NAME       GATEWAYS             HOSTS   AGE
bookinfo   [bookinfo-gateway]   [*]     34s
```

Let's get the gateway url
using minkube vm ip
```
export INGRESS_HOST=$(minikube ip)
export INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].nodePort}')
```

using clusterIP
```
export INGRESS_HOST=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.clusterIP}')
export INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].port}')
```

Create GATEWAY_URL variable
```
export GATEWAY_URL=$INGRESS_HOST:$INGRESS_PORT
export APP_URL=http://$GATEWAY_URL/productpage
echo open $APP_URL
curl -s $APP_URL | grep -o "<title>.*</title>"
```
output:
```
<title>Simple Bookstore App</title>
```


Open all the ports and open the UIs for Graphana, Jaeger, Kiali
Drive some load

```
while true; do curl $APP_URL -I -s | grep "HTTP/" ; done
```
Using hey:
```
hey -c 1 -z 5m -H $APP_URL
```


