Buildar a. imagem
docker build -t app .

Instalar o NGINX Ingress Controller no nosso cluster:
kubectl apply -f https://github.com/kubernetes/ingress-nginx/blob/master/deploy/static/mandatory.yaml


Criar o Service que irá expor o nosso Ingress Controller:
kubectl apply -f https://github.com/kubernetes/ingress-nginx/blob/master/deploy/static/provider/baremetal/service-nodeport.yaml

Verifique se o serviço foi criado:
kubectl get services --namespace=ingress-nginx

Colete os dados 
Com o nosso Ingress Controller instalado e exposto, crie as. aplicaçoes

Preparando os Pods e os Services

Crie um arquivo chamado deployment.yaml com esse conteúdo:

apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  labels:
    app: app
spec:
  selector:
    matchLabels:
      app: app
  template:
    metadata:
      labels:
        app: app
    spec:
      containers:
      - name: app
        image: app:1.0
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 30
          timeoutSeconds: 10
        ports:
        - containerPort: 3000
        name: http
      readinessProbe:
        httpGet:
          path: /healthz
          port: 8080
        initialDelaySeconds: 10
        timeoutSeconds: 10
      resources:
        limits:
          cpu: 100m
          memory: 128Mi
        requests:
          cpu: 25m
          memory: 64Mi

---

kind: Service
apiVersion: v1
metadata:
  name: app
spec:
  selector:
    app: app
  ports:
  - protocol: TCP
    port: 3000
  type: NodePort


Execute. Com o comando:

kubectl apply -f deployment.yaml

Faça o deploy de um nginx e exponha o serviço dele:
kubectl run deploy-nginx --image nginx
kubectl expose deployment deploy-nginx --type=NodePort --name=nginx-service --port 80

Check os serviços:
Kubectl get services
Ingress Resource
Vamos configurar para que o host name http://api.app.net seja direcionado para a webapi e que o host name http://nginx.app.net seja direcionado para o NGINX. Coloque o conteúdo abaixo num arquivo chamado ingress-resource.yaml

Podemos ver o arquivo YAML logo abaixo:

apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: virtual-host
spec:
  rules:
  - host: api.app.net
    http:
      paths:
      - backend:
          serviceName: app
          servicePort: 80
  - host: nginx.app.net
    http:
      paths:
      - backend:
          serviceName: nginx-service
          servicePort: 80

Antes de configurar uma regra, vamos configurar o host. Nos temos o api.app.net e o nginx.app.net. Junto com o host, vamos configurar os paths. Nos temos o path padrão e o backend, que no caso é o nome do Service e a porta que vamos direcionar.\\

Execute o comando;

kubectl apply -f ingress-resource.yaml

Cheque o serviço;  
kubectl get ingress

O Ingress Controller vai estar configurado e podemos acessar as aplicações utilizando as urls configuradas.
Para acessar a api:
http://api.app.net:<port> 
NGINX:
http://nginx.app.net:<port> 















