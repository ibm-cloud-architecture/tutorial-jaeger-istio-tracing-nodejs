# Setup Istio on Minikube

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

Let's get the gateway url

1. Using LoadBalancer if you restart minikube VM and re-run `minikube tunnel`
```
export INGRESS_HOST=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
export INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].port}')
```

2. Using minkube vm ip and NodePort
```
export INGRESS_HOST=$(minikube ip)
export INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].nodePort}')
```

3. Using clusterIP if `CLUSTER-IP` is `<pending>` for `istio-egressgateway`
```
export INGRESS_HOST=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.clusterIP}')
export INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].port}')
```

Check `INGRESS_HOST` and `INGRESS_PORT`
```
echo INGRESS_HOST=$INGRESS_HOST
echo INGRESS_PORT=$INGRESS_PORT
```

Create `GATEWAY_URL` variable
```
export GATEWAY_URL=$INGRESS_HOST:$INGRESS_PORT
echo GATEWAY_URL=$GATEWAY_URL
```

You can test if Istio is working by installing the Istio Bookinfo sample here [bookinfo.md](bookinfo.md)