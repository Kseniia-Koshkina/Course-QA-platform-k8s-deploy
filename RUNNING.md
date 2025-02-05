### Start application

Inside qa-ui folder run the following:
```
npm install
npm run build (for production)
```

Run the application with the following command (in develop/production mode).
```
docker-compose up
docker compose -f docker-compose.prod.yml --profile migrate --profile pgadmin up -d (for production)
```

Stop production
```
docker compose down
```

### Test application

Run the E2E tests with the following command.
```
docker compose run --entrypoint=npx e2e-playwright playwright test  
docker compose rm -sf
```

### Kubernetes deploy with Minikube

```
minikube start --memory=4096 --cpus=4 --addons=metrics-server
```

#### 1. Build images:

(nginx folder)
```
minikube image build -t nginx -f ./Dockerfile .
```

(llm-api folder)
```
minikube image build -t llm-api -f ./Dockerfile .
```

(qa-ui folder)
```
minikube image build -t qa-ui -f ./Dockerfile.prod .
```

(qa-api folder)
```
minikube image build -t qa-api -f ./Dockerfile.prod .
```

(flyway folder)
```
minikube image build -t db-migrations -f ./Dockerfile .
```

#### 2. Deploy application:

Deploy each part of the application and make them available for internal communication as well as external for nginx.  

Database:
```
kubectl apply -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.19/releases/cnpg-1.19.1.yaml
kubectl get all -n cnpg-system (check whether the controller is running)
kubectl apply -f kubernetes/db-cluster.yaml
```
Wait for cluster to initialize pods, then perform flyway migration job:
```
kubectl apply -f kubernetes/db-migrations.yaml
```

Redis:
```
kubectl apply -f kubernetes/redis-config.yaml
kubectl apply -f kubernetes/redis-deployment.yaml
kubectl apply -f kubernetes/redis-service.yaml
```

llm-api:
```
kubectl apply -f kubernetes/llm-api-deployment.yaml
kubectl apply -f kubernetes/llm-api-service.yaml
```

qa-api:
```
kubectl apply -f kubernetes/qa-api-deployment.yaml
kubectl apply -f kubernetes/qa-api-service.yaml
```

qa-ui:
```
kubectl apply -f kubernetes/qa-ui-deployment.yaml  
kubectl apply -f kubernetes/qa-ui-service.yaml
```

nginx:
```
kubectl apply -f kubernetes/nginx-deployment.yaml  
kubectl apply -f kubernetes/nginx-service.yaml
```

#### 3. Horizontal Pod Autoscaling:

```
kubectl apply -f kubernetes/qa-api-hpa.yaml  
kubectl apply -f kubernetes/llm-api-hpa.yaml  
kubectl apply -f kubernetes/qa-ui-hpa.yaml
```

#### 4. Access application:

```
minikube service nginx --url
```

#### Prometheus & Grafana:

Prometheus:
```
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml  
OR
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml --force-conflicts=true --server-side=true  

kubectl apply -f kubernetes/prometheus_rbac.yaml  
kubectl apply -f kubernetes/prometheus_instance.yaml  
kubectl apply -f kubernetes/service_monitor.yaml  
kubectl apply -f kubernetes/expose_prometheus.yaml  
```

Grafana:
```
kubectl create deployment grafana --image=docker.io/grafana/grafana:latest 
kubectl expose deployment grafana --port 3000
kubectl port-forward svc/grafana 3000:3000  
```
Access grafana http://localhost:3000

Choose the Prometheus as data source. To view the `<node_ip>`, run 
```
kubectl get nodes -o wide
```
Then, enter `http://<node_ip>:30900` in the URL box.

