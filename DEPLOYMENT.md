# Procédure Complète de Déploiement : Projet Front Parallax

Ce document décrit étape par étape comment déployer ce projet frontend React/Vite sur une **Machine Virtuelle locale (à un seul cœur) avec une connexion internet**.
Le processus est conçu pour être permanent : une fois déployé, l'application restera active même si vous fermez votre session SSH et redémarrera toute seule si votre VM est redémarrée.

---

## 1. Prérequis (Sur la Machine Virtuelle)

Avant de commencer le déploiement, votre machine virtuelle doit obligatoirement avoir **Docker** et **Docker Compose** d'installés.

### Installation de Docker et Docker Compose (si non installés sur la VM) :

Connectez-vous en SSH sur votre VM, puis tapez ces commandes :

```bash
# 1. Mettre à jour l'index apt
sudo apt-get update

# 2. Installer les paquets pré-requis
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# 3. Ajouter la clé GPG officielle de Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 4. Configurer le dépôt officiel
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Installer Docker et Docker Compose
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 6. (Recommandé) Permettre d'utiliser Docker sans sudo
sudo usermod -aG docker $USER
newgrp docker
```

_(Note : Si vous utilisez Debian au lieu de Ubuntu, ajustez l'URL `linux/ubuntu` en `linux/debian`)_

---

## 2. Transfert du projet vers la VM

Vous devez envoyer le dossier complet du projet de votre machine locale vers la VM. Vous pouvez utiliser `scp` pour cette étape (à faire depuis la machine où se trouvent les fichiers ou via un git clone).

**Option A (Si vous passez par Git) :**

```bash
# Sur la VM :
git clone <votre-lien-du-repo-git>
cd front_parallax
```

**Option B (Si vous transférez via SSH / SCP) :**
Depuis _votre machine physique locale_, tapez :

```bash
# Copie tout le dossier (Sauf node_modules si possible, ce n'est pas nécessaire) vers la VM
scp -r "/home/tomson/Thomas/Cours_4GI/S2/Grid One/front_parallax" nom_utilisateur@IP_DE_VOTRE_VM:/home/nom_utilisateur/
```

Ensuite, depuis votre VM, placez vous dans le répertoire :

```bash
# Sur la VM :
cd ~/front_parallax
```

---

## 3. Lancement et Déploiement

Une fois que les fichiers (incluant le `Dockerfile`, `docker-compose.yml` et `nginx.conf`) sont sur la VM et que vous êtes dans le dossier, il suffit d'une seule commande.

```bash
docker compose up -d --build
```

**Ce que fait cette commande :**

1. `--build` : Demande à Docker de lire le `Dockerfile`, de télétcharger Node.js, d'installer les dépendances (`npm ci`), de compiler le code (`npm run build`), et de mettre les résultats dans le serveur Nginx. **Le compilateur ne sera plus exécuté par la suite ce qui préserve les ressources de votre CPU 1 cœur.**
2. `-d` (Detached) : Detache le terminal. **C'est ce flag qui permet à votre application de tourner en arrière plan, même quand vous quittez la session SSH**.
3. Le fichier `docker-compose.yml` intègre l'instruction `restart: unless-stopped`. Cela agit comme un service système : **Si la VM redémarre, Docker se lancera au démarrage et relancera ce conteneur.**

---

## 4. Maintenance / Gestion (Commandes utiles)

Toutes ces commandes doivent s'exécuter dans le répertoire du projet sur la vm.

**Voir les logs en direct :**

```bash
docker compose logs -f
```

**Arrêter l'application (Désactivera aussi le redémarrage automatique):**

```bash
docker compose down
```

**Mettre à jour l'application suite à des modifications du code :**

```bash
git pull (ou un nouveau transfert SCP)
docker compose up -d --build
```

## Vérification

Une fois la commande `docker compose up -d` terminée, vous pouvez directement ouvrir votre navigateur internet sur : `http://IP_DE_VOTRE_VM` (car le port utilisé par défaut est le port 80, configuré en interne par Nginx et exposé).
L'application s'affichera immédiatement !
