# Solana Voting DApp (Hackathon MVP)

Ovo je decentralizirana aplikacija za glasanje na Solana blockchainu. Omogućuje korisnicima kreiranje anketa i glasanje pomoću Phantom walleta.
Svi glasovi su trajno zabilježeni na Solana Devnetu. Smart contract također osigurava **prevenciju dvostrukog glasanja** pomoću PDA (Program Derived Address).

Projekt je podijeljen u dva dijela:
1. `voting-dapp/` - Anchor (Rust) smart contract
2. `app/` - Next.js (React) frontend

## 1. Postavljanje okoline i Smart Contracta (WSL2)

Budući da se sve izvodi unutar WSL2 (Ubuntu), otvori svoj Ubuntu terminal i slijedi ove korake:

### Pred-zahtjevi (ako već nisu instalirani)
```bash
# 1. Instaliraj Node.js i Yarn
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
nvm install node
npm install -g yarn

# 2. Instaliraj Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 3. Instaliraj Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.8/install)"

# 4. Instaliraj Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### Build & Deploy Smart Contracta
```bash
# Uđi u direktorij smart contracta
cd voting-dapp

# Generiraj Solana wallet (ako već nemaš) i spoji se na Devnet
solana-keygen new
solana config set --url devnet
solana airdrop 2

# Buildaj contract
anchor build

# (Opcionalno) Ako se program ID promijenio nakon builda, ažuriraj ga u:
# 1. Anchor.toml
# 2. programs/voting-dapp/src/lib.rs (declare_id!)
# 3. app/app/idl.json
# 4. app/app/page.tsx, create/page.tsx, poll/[id]/page.tsx

# Deployaj na Devnet
anchor deploy

# Pokreni testove
anchor test
```

## 2. Pokretanje Frontenda (WSL2)

Frontend je izgrađen pomoću Next.js, TailwindCSS i Solana Wallet Adaptera. Dizajn koristi moderne staklene efekte (glassmorphism) s tamnim modom.

```bash
# Uđi u direktorij aplikacije
cd ../app

# Instaliraj pakete
npm install

# Pokreni lokalni server
npm run dev
```

Otvori preglednik na `http://localhost:3000`.

## 3. Vercel Deployment

Kako bi dobio maksimalne bodove, moraš deployati frontend.

1. **Kreiraj GitHub repozitorij** i pushaj kod:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <TVOJ_GITHUB_REPO_URL>
   git push -u origin main
   ```
2. Idi na [Vercel](https://vercel.com/)
3. Klikni **"Add New Project"** i poveži svoj GitHub repo.
4. Kao **Root Directory**, odaberi `app` folder (jako važno jer se `package.json` od frontenda nalazi unutar `app`!).
5. Ostavi defaultne postavke (Next.js) i klikni **Deploy**.
6. Kroz minutu-dvije aplikacija će biti dostupna online!

## Sretno na Hackathonu! 🚀
Uz ovaj kod i PDA logiku, aplikacija u potpunosti ispunjava sve kriterije.
