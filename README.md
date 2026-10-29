# WAVE — simulation de mobile money

Simulation pédagogique d'une application de mobile money inspirée de Wave :
inscription par numéro de téléphone, vérification OTP, code PIN, vérification
d'identité (KYC), dépôts et transferts d'argent.

> Aucun argent réel, aucun lien avec le service Wave.

## Stack

| Partie | Technologies |
|---|---|
| App mobile | React Native · Expo SDK 58 · Expo Router (JavaScript) |
| API | FastAPI · SQLAlchemy 2 · Alembic · Pydantic |
| Base de données | PostgreSQL |
| Sécurité | PIN et OTP hachés (bcrypt) · JWT · SecureStore |

## Fonctionnalités

- **Inscription** : numéro (sélecteur de pays) → création et confirmation du PIN → OTP à 6 chiffres.
- **KYC** : nom, date de naissance, pièce d'identité et photo (appareil photo ou galerie).
- **Connexion** : le numéro est mémorisé, seul le PIN est demandé ensuite.
- **Verrouillage** : dès que l'app passe en arrière-plan, le PIN est redemandé.
- **Blocage progressif** : 3 PIN faux → 1 min, puis 5 min, 15 min, 1 h.
- **Dépôt** fictif et **transfert** vers un autre compte (frais de 1 %, arrondis au franc supérieur).
- **Historique** paginé et **reçu** détaillé de chaque opération.

## Règles métier

| Règle | Valeur |
|---|---|
| Montant par opération | 100 à 1 500 000 FCFA |
| Frais de transfert | 1 % payé par l'expéditeur, dépôts gratuits |
| OTP | 6 chiffres, valable 5 min, renvoi après 60 s, 5 essais |
| PIN | 4 chiffres, vérifié par le serveur, jamais stocké sur le téléphone |

Elles sont définies dans [backend/app/core/rules.py](backend/app/core/rules.py).

## Lancer le projet

### 1. API

Prérequis : Python 3.12+ et PostgreSQL avec deux bases, `wave` et `wave_test`.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env        # puis renseigner le mot de passe PostgreSQL et JWT_SECRET
alembic upgrade head          # crée les tables
fastapi dev app/main.py --host 0.0.0.0
```

- Documentation interactive : http://127.0.0.1:8000/docs
- Les **codes OTP s'affichent dans ce terminal** (SMS simulé).
- Tests : `pytest -q`

### 2. App mobile

```powershell
npm install
npx expo start --clear
```

Scanner le QR code avec **Expo Go**. Le téléphone et le PC doivent être sur le
même Wi-Fi. L'adresse de l'API est déduite automatiquement de l'IP du PC. Pour
la forcer, voir [.env.example](.env.example).

## Scénario de démonstration

1. Créer un compte A (numéro, PIN, OTP lu dans le terminal de l'API, KYC).
2. Faire un dépôt de 10 000 F.
3. « Changer de compte » dans le profil, puis créer un compte B.
4. Revenir sur A et envoyer 5 000 F à B : 50 F de frais, solde de A = 4 950 F.
5. Mettre l'app en arrière-plan puis revenir : le PIN est redemandé.
6. Taper 3 PIN faux : le compte est bloqué 1 minute.

## Architecture

```
WAVE/
├── src/
│   ├── app/              écrans (Expo Router : chaque fichier = une route)
│   │   ├── (auth)/       numéro, PIN, OTP, connexion
│   │   ├── kyc.js        vérification d'identité
│   │   └── (app)/        accueil, dépôt, transfert, historique, profil
│   ├── components/       clavier numérique, cases de code, écran de verrouillage…
│   ├── context/          session et verrouillage (AuthContext)
│   ├── api/              appels HTTP vers FastAPI
│   └── hooks/ utils/ constants/
└── backend/
    ├── app/
    │   ├── api/routes/   points d'entrée HTTP
    │   ├── schemas/      validation des données (Pydantic)
    │   ├── services/     règles métier (transferts, OTP, blocage)
    │   ├── models/       tables PostgreSQL (SQLAlchemy)
    │   └── core/         configuration, sécurité, règles
    ├── alembic/          migrations
    └── tests/            36 tests (pytest)
```

### Points de sécurité

- **Transferts atomiques** : débit, crédit et historique dans une seule transaction SQL.
- **`SELECT … FOR UPDATE`** : deux transferts simultanés ne peuvent pas vider un compte deux fois.
- **Clé d'idempotence** : un double appui ou une requête renvoyée ne débite qu'une fois.
- **`CHECK (balance >= 0)`** : PostgreSQL refuse tout solde négatif, même en cas de bug.
- **Token en mémoire uniquement** : il disparaît dès que l'app est fermée ou mise en arrière-plan.
