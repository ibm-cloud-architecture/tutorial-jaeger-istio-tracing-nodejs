# Bookinfo Demo

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

Set the enviroment variables `INGRESS_HOST` and `INGRESS_PORT` this will depend if you are using Minkube or another type of Cloud Kubernetes service.
More info here https://istio.io/docs/tasks/traffic-management/ingress/#determining-the-ingress-ip-and-ports

Create GATEWAY_URL variable
```
export GATEWAY_URL=$INGRESS_HOST:$INGRESS_PORT
echo GATEWAY_URL=$GATEWAY_URL
export APP_URL=http://$GATEWAY_URL/productpage
echo APP_URL=$APP_URL
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