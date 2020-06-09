1- Criar repositorios de aplicações ECR (tem que ser com mesmo nome do repo) e se for o caso fazer o upload delas
Ex:
  304243956035.dkr.ecr.sa-east-1.amazonaws.com/nome-do-repo 
  git config --get remote.origin.url | sed 's/.*\/\([^ ]*\/[^.]*\).*/\1/' | sed 's/micro-servicos//'

2- Criar um repo de infraestrutura com um pasta para o GitLab-CI e uma para ArgoCD
Ex:

    ArgoCD -> argocd/app/development/nome-da-app/
              argocd/app/stage/nome-da-app/
              argocd/app/homologaçao/nome-da-app/
              argocd/app/produçao/nome-da-app/
                                              ConfigMap.yml
                                              Deployment.yaml 
                                                Ingress.yml (?)
                                              Service.yml
                  
3- Instalar EKS 

-- Passos para provisionamento do cluster EKS
    -- criar keypair com nome EKS
    -- Instalar choco veja manual em:  https://chocolatey.org/
    -- Instalar a versão mais recente do aws CLI
    -- Executar comando aws configure para autenticar com usuário com privilégio administrativo
    -- Instalar eksctl
        -- No windows
            -- Acessar POWERSHELL com priviégio administrativo 
            -- Executar comando: chocolatey install -y eksctl aws-iam-authenticator
            -- Verificar se a verão é => 0.14.0 com o comando eksctl version
    -- Instalar kubectl
        -- Com o choco instalado execute: choco install kubernetes-cli
        -- Verifique a versão: kubectl version --client
        -- Acesse o diretório do usuário
        -- Crie o diretório .kube
    --  Configure o kubectl para  usar o cluster remoto kubernetes
        -- New-Item config -type file


eksctl create cluster --name dev-cluster --version 1.15 --region us-east-1 --ssh-public-key=eks --nodegroup-name dev-standard-workers --node-type t3.medium --nodes 3 --nodes-min 1 --nodes-max 4 --ssh-access  --managed



4- Instalar o ArgoCD no EKS 

# Install Argo CD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Create new cluster roles
kubectl create clusterrolebinding argocd-cluster-admin-binding --clusterrole=cluster-admin --user=tiago.de.almeida8@gmail.com

# Trocar por NodePort
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'

# Listar Porta do Server 
kg svc 

# Portas
    nodePort: 31828

# Printar a senha:
kubectl get pods -n argocd -l app.kubernetes.io/name=argocd-server -o name | cut -d'/' -f 2
ele printa uma senha:

  argocd-server-<senha>

# Logar:
argocd login <ARGOCD_SERVER>

    # Acessos
    User: admin
    Senha: argocd-server-<senha>

# Trocar a senha:
argocd account update-password

# Registrar um Cluster
argocd cluster add kubernetes-admin@cluster.local

## Criando secret
kubectl -n argocd create secret generic my-secret --from-file=ssh-privatekey=/root/.ssh/argocd --from-file=ssh-publickey=/root/.ssh/argocd.pub

### ConfigMap
cat > configmap.yml

apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
  labels:
    app.kubernetes.io/name: argocd-cm
    app.kubernetes.io/part-of: argocd
data:
  repositories: |
    - url: git@gitlab.com:stitdata/internal/st-it-ops-microservices/ms-template-k8s.git
      sshPrivateKeySecret:
        name: my-secret
        key: ssh-privatekey

 
kubectl apply -f configmap.yml


5- Criar todas as aplicações conforme ECR/repositório no ARGOCD

# Deploy automatizado com ArgoCD 

Para criar uma aplicação no [ArgoCD](https://argoproj.github.io/argo-cd/#what-is-argo-cd) pela [Dashboard](https://a678a7151705e4a5d94f16bdf2e0dc30-635835166.sa-east-1.elb.amazonaws.com/applications)

### Dashboard:

Logue no endereço `https://a678a7151705e4a5d94f16bdf2e0dc30-635835166.sa-east-1.elb.amazonaws.com/applications`

**user:** `admin`
**pass:** `P@ss4n0w`

Vá em **+ NEW APP**

![+ NEW APP](https://argoproj.github.io/argo-cd/assets/new-app.png)

`General` Preencha com o nome da aplicação e selecione o projeto.
![General](https://argoproj.github.io/argo-cd/assets/app-ui-information.png)

Em `Source`, na linha Repository URL, coloque o endereço do repósitorio de templates do k8s: `git@github.com:IronTrainers/k8s.git`.
**Revision** `HEAD` e **Path** `argocd/app/<AMBIENTE>/<NOME-DA-APLICACAO>`, Cluster coloque `in-cluster (https://kubernetes.default.svc)` e Namespace escolha entre develop | production (É necessário ter a mesma aplicação nos 2 ambientes)

![Source](https://argoproj.github.io/argo-cd/assets/connect-repo.png)

E finalize em `CREATE`.

Clique na sua aplicação, `REFRESH` e `SYNC`. 
![REFRESH](https://argoproj.github.io/argo-cd/assets/guestbook-app.png)
