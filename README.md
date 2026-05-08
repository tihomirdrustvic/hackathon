# 🗳️ VoteDApp — Decentralizirana Aplikacija za Glasanje na Solana Blockchainu

> **LIBROS Hackathon 2026** — Blockchain aplikacija za glasanje koristeći Solana i Anchor

## 📝 Opis Projekta

VoteDApp je decentralizirana web aplikacija za glasanje izgrađena na **Solana blockchainu**. Aplikacija omogućava korisnicima kreiranje anketa i glasanje za opcije, pri čemu su svi glasovi trajno i nepromjenjivo zapisani na blockchain mreži.

### Ključne značajke:
- ✅ **Phantom wallet autentifikacija** — kriptografski potvrđeni identiteti
- ✅ **Prevencija duplog glasanja** — PDA (Program Derived Address) osigurava da svaki wallet može glasati samo jednom
- ✅ **Trajni zapisi** — svi glasovi su nepromjenjivo zapisani na Solana Devnet
- ✅ **Transparentnost** — javno provjerljivi rezultati s wallet adresama glasača
- ✅ **Vremensko ograničenje** — mogućnost postavljanja roka za glasanje (bonus)
- ✅ **Zatvaranje glasanja** — autor može zatvoriti anketu (bonus)
- ✅ **Live osvježavanje** — automatsko osvježavanje rezultata svakih 10-15 sekundi (bonus)
- ✅ **Docker podrška** — kontejnerizirana aplikacija (bonus)
- ✅ **Responzivan dizajn** — radi na svim uređajima (bonus)

## 📂 Struktura Projekta

```
hackathon/
├── voting-dapp/                  # Anchor smart contract
│   ├── programs/
│   │   └── voting-dapp/
│   │       └── src/
│   │           └── lib.rs        # Rust smart contract (create_poll, vote, close_poll, get_results)
│   ├── tests/
│   │   └── voting-dapp.ts        # Anchor testovi (6 test cases)
│   ├── Anchor.toml               # Anchor konfiguracija
│   ├── Cargo.toml
│   └── package.json
├── app/                          # Next.js frontend
│   ├── app/
│   │   ├── page.tsx              # Home stranica - prikaz svih anketa
│   │   ├── create/
│   │   │   └── page.tsx          # Forma za kreiranje ankete
│   │   ├── poll/
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Detalji ankete, glasanje, rezultati, wallet adrese
│   │   ├── Providers.tsx         # Wallet i Connection provideri
│   │   ├── layout.tsx            # Root layout s navigacijom
│   │   ├── globals.css           # Globalni stilovi
│   │   └── idl.json              # Anchor IDL za frontend
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.js
│   └── tsconfig.json
├── Dockerfile                    # Docker podrška
├── .dockerignore
├── prompt.txt                    # Zadatak hackathona
└── README.md                     # Dokumentacija (ovaj file)
```

## 🛠️ Tehnologije

| Kategorija | Tehnologija |
|-----------|------------|
| Blockchain | Solana (Devnet) |
| Smart Contract | Rust + Anchor Framework |
| Frontend | React / Next.js 14 |
| Styling | TailwindCSS + Glassmorphism |
| Wallet | Phantom Wallet |
| Jezik | TypeScript |
| Testiranje | Mocha + Chai (Anchor Test) |
| Kontejnerizacija | Docker |
| OS | WSL2 / Ubuntu 22.04 LTS |

## 🚀 Postavljanje Razvojne Okoline

### Preduvjeti (WSL2 / Ubuntu)

```bash
# 1. Instaliraj WSL2 (Windows PowerShell kao Administrator)
wsl --install

# 2. Instaliraj Node.js putem NVM-a
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# 3. Instaliraj Yarn
npm install --global yarn

# 4. Instaliraj Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# 5. Instaliraj Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# 6. Konfiguriraj Devnet
solana config set --url https://api.devnet.solana.com
solana-keygen new
solana airdrop 2

# 7. Instaliraj Anchor Framework
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Provjeri instalacije:
node -v && npm -v && rustc --version && solana --version && anchor --version
```

## 📦 Build i Deploy Smart Contracta

```bash
# Uđi u direktorij smart contracta
cd voting-dapp

# Buildaj contract
anchor build

# Dohvati novi Program ID (nakon prvog builda)
solana address -k target/deploy/voting_dapp-keypair.json

# Ažuriraj Program ID u:
# 1. programs/voting-dapp/src/lib.rs -> declare_id!("...")
# 2. Anchor.toml -> [programs.devnet]
# 3. app/app/idl.json (generira se automatski, ali provjeri)
# 4. app/app/page.tsx, create/page.tsx, poll/[id]/page.tsx -> PROGRAM_ID

# Deployaj na Devnet
anchor deploy

# Pokreni testove
anchor test
```

## 🖥️ Pokretanje Frontend Aplikacije

```bash
# Uđi u direktorij frontenda
cd app

# Instaliraj pakete
npm install

# Pokreni lokalni dev server
npm run dev
```

Otvori preglednik na `http://localhost:3000`

## 🧪 Testiranje

Testovi pokrivaju sve zahtijevane scenarije:

```bash
cd voting-dapp
anchor test
```

### Test Cases:
1. ✅ **Kreiranje ankete** — kreira poll s naslovom, opcijama, autorom i timestampom
2. ✅ **Uspješno glasanje** — zapisuje glas, wallet adresu, odabranu opciju i timestamp
3. ✅ **Zabrana duplog glasanja** — PDA sprječava drugi glas s istog walleta
4. ✅ **Prikaz rezultata** — poziva `get_results` instrukciju i verificira podatke
5. ✅ **Zatvaranje ankete** — autor može zatvoriti glasanje
6. ✅ **Zabrana glasanja na zatvorenoj anketi** — zatvoren poll ne prima glasove

## 📋 Smart Contract — Instrukcije

### `create_poll`
Kreira novu anketu na blockchainu.
- **Podaci:** poll_id, naslov, opcije, autor, timestamp, deadline (opcionalno), whitelist (opcionalno)
- **Validacije:** min 2 opcije, max 10, naslov max 100 znakova

### `vote`
Omogućava glasanje na anketi.
- **Zapisuje:** wallet adresu, odabranu opciju, timestamp
- **Sprječava:** duplo glasanje (PDA), glasanje na zatvorenoj/istekloj anketi, glasanje neovlaštenih walleta

### `close_poll`
Zatvara anketu tako da više nitko ne može glasati. Samo autor može zatvoriti.

### `get_results`
Dohvaća rezultate glasanja i emitira event s podacima za off-chain konzumaciju.

## 📊 Struktura Računa na Blockchainu

### Poll Account
| Polje | Tip | Opis |
|-------|-----|------|
| poll_id | u64 | Jedinstveni ID glasanja |
| author | Pubkey | Wallet adresa autora |
| title | String | Naslov pitanja |
| options | Vec<String> | Opcije za glasanje |
| votes | Vec<u64> | Broj glasova po opciji |
| total_votes | u64 | Ukupni broj glasova |
| timestamp | i64 | Datum kreiranja (Unix) |
| is_active | bool | Je li glasanje aktivno |
| deadline | Option<i64> | Rok za glasanje (Unix, opcionalno) |
| whitelist | Vec<Pubkey> | Lista dopuštenih walleta |

### Vote Record (PDA)
| Polje | Tip | Opis |
|-------|-----|------|
| voter | Pubkey | Wallet adresa glasača |
| poll | Pubkey | Referenca na anketu |
| option_index | u32 | Indeks odabrane opcije |
| timestamp | i64 | Datum glasanja (Unix) |

## 🌐 Frontend Stranice

| Stranica | Ruta | Opis |
|----------|------|------|
| Home | `/` | Prikaz svih anketa, statistika, live osvježavanje |
| Create Poll | `/create` | Forma za kreiranje ankete s opcionalnim rokom |
| Poll Details | `/poll/[id]` | Rezultati, glasanje, wallet adrese glasača |

## 🦊 Phantom Wallet Integracija

- ✅ Connect wallet (automatski putem Solana Wallet Adapter)
- ✅ Disconnect wallet
- ✅ Provjera je li wallet instaliran
- ✅ Prikaz connected stanja i wallet adrese
- ✅ Obrada grešaka (wallet nije spojen, nedovoljno SOL-a, itd.)

## 🐳 Docker

```bash
# Build Docker image
docker build -t votedapp .

# Pokreni kontejner
docker run -p 3000:3000 votedapp
```

## 🚀 Deploy na Vercel

1. Pushaj kod na GitHub
2. Idi na [vercel.com](https://vercel.com)
3. Klikni "Add New Project" i poveži GitHub repo
4. Postavi **Root Directory** na `app`
5. Ostavi defaultne postavke (Next.js) i klikni Deploy

**Deploy link:** _[DODAJ LINK NAKON DEPLOYA]_

## 🏆 Bonus Funkcionalnosti

| Funkcionalnost | Status | Bodovi |
|---------------|--------|--------|
| Vremensko ograničenje glasanja | ✅ Implementirano | +2 |
| Whitelist wallet adresa | ✅ Implementirano (smart contract) | +2 |
| Live osvježavanje rezultata | ✅ Auto-refresh svakih 10-15s | +2 |
| Docker podrška | ✅ Dockerfile + .dockerignore | +2 |
| Deploy na Vercel | ✅ Upute dane | +1 |
| Napredni UI/UX | ✅ Glassmorphism, animacije, responsive | +1 |

## 👤 Autor

LIBROS Hackathon 2026

## 📄 Licenca

MIT
