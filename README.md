# 🗳️ VoteDApp — Decentralizirani Sustav Glasanja

<p align="center">
  <img width="100%" height="auto" alt="VoteDApp Sučelje" src="[https://github.com/user-attachments/assets/a6d1634e-c011-4fd5-8968-ffd41ec11151](https://github.com/user-attachments/assets/a6d1634e-c011-4fd5-8968-ffd41ec11151)" />
</p>

---

### 🏆 LIBROS Hackathon 2026
**Blockchain aplikacija za glasanje koristeći Solana i Anchor framework.**

[![Live Demo](https://img.shields.io/badge/Demo-Vercel-blue?style=for-the-badge&logo=vercel)](https://hackathon-ruby-nine.vercel.app/)
[![Program ID](https://img.shields.io/badge/Solana-Devnet-purple?style=for-the-badge&logo=solana)](https://explorer.solana.com/address/GwqoDrpHQHiKWbHA6RFr84tNZbm22u8UTQABKDt8j8KM?cluster=devnet)

> **Smart Contract ID:** `GwqoDrpHQHiKWbHA6RFr84tNZbm22u8UTQABKDt8j8KM`

---

## 📝 O projektu

VoteDApp rješava problem povjerenja i transparentnosti u izbornim procesima. Tradicionalne baze podataka podložne su manipulacijama, stoga ovaj sustav koristi **Solana blockchain** kako bi osigurao da je svaki predani glas trajan, nepromjenjiv i javno provjerljiv, dok istovremeno štiti integritet samog glasanja.

### ✨ Ključne značajke

* 🔑 **Kriptografski identitet** — Autentifikacija isključivo putem Phantom walleta.
* 🚫 **Prevencija duplog glasanja (PDA)** — Program Derived Address arhitektura na razini smart contracta matematički onemogućava višestruko glasanje s iste adrese.
* 🔍 **On-Chain transparentnost** — Sva pitanja, opcije i glasovi zapisuju se direktno na Devnet.
* 🛠️ **Napredne kontrole** — Implementirana vremenska ograničenja (*deadlines*), mogućnost ručnog zatvaranja ankete od strane autora i *Whitelist* pristup.
* ⚡ **Real-time UX** — Frontend automatski osvježava stanje s blockchaina (*auto-refresh*) i sadrži responzivni *Glassmorphism* UI.

## 🎥 Video Demonstracija

[▶️ Pogledaj demo video na Streamable](https://streamable.com/8w0swy)

---

## 🛠️ Tech Stack

| Komponenta | Tehnologija |
| :--- | :--- |
| **Blockchain** | Solana (Devnet) |
| **Smart Contract** | Rust + Anchor Framework |
| **Frontend** | Next.js 14 (App Router), React, TailwindCSS |
| **Wallet Integracija** | Solana Wallet Adapter, Phantom |
| **Testiranje** | Mocha + Chai (Anchor testovi) |
| **Infrastruktura** | Vercel (Web), Docker |

---

## 📂 Struktura repozitorija

```text
hackathon/
├── voting-dapp/                  # Rust Smart Contract (Anchor)
│   ├── programs/voting-dapp/src/ # Logika contracta (lib.rs)
│   ├── tests/                    # E2E Anchor testovi
│   └── Anchor.toml               # Konfiguracija mreže
├── app/                          # Next.js Web Klijent
│   ├── app/                      # Stranice, layout i globalni stilovi
│   ├── components/               # UI komponente
│   └── app/idl.json              # Anchor IDL za frontend interakciju
└── Dockerfile                    # Konfiguracija za kontejnerizaciju

```

---

## 🚀 Brzi start (Lokalni razvoj)

### Preduvjeti

Sustav zahtijeva instalirane: `Node.js` (LTS), `Rust`, `Solana CLI` i `Anchor CLI`. Preporučuje se rad u WSL2/Ubuntu okruženju.

### 1. Smart Contract (Anchor)

```bash
# Ulazak u direktorij contracta
cd voting-dapp

# Postavi mrežu na Devnet
solana config set --url https://api.devnet.solana.com

# Buildaj i deployaj
anchor build
anchor deploy

# Pokreni testove za validaciju logike
anchor test

```

### 2. Web Klijent (Next.js)

```bash
# Ulazak u direktorij aplikacije
cd ../app

# Instalacija ovisnosti
npm install

# Pokretanje razvojnog servera
npm run dev

```

Aplikacija je dostupna na `http://localhost:3000`.

### 3. Docker (Opcionalno)

Za izolirano pokretanje frontenda:

```bash
docker build -t votedapp .
docker run -p 3000:3000 votedapp

```

---

## 📋 Smart Contract Arhitektura

Naš Anchor program izlaže četiri glavne instrukcije za klijentsku interakciju:

1. `create_poll` — Inicijalizira anketu. Prihvaća metapodatke te opcionalne parametre (deadline, whitelist).
2. `vote` — Glavna transakcijska metoda. Generira PDA na temelju ankete i walleta. Ako PDA već postoji, transakcija se odbija.
3. `close_poll` — Autorizirana metoda koja omogućava kreatoru da zaključa anketu.
4. `get_results` — Helper funkcija za strukturirano on-chain dohvaćanje stanja.

### Struktura zapisa (Accounts)

* **Poll Account**: Sadrži ID, autora, naslov, opcije, glasove, timestamp i status.
* **Vote Record (PDA)**: Relacijski račun koji trajno spaja `voter_pubkey` i `poll_id`, osiguravajući pravilo "jedan korisnik - jedan glas".

---

## 👥 Tim LIBROS

* Lana Baćani
* Antonija Jurić
* Antun Kozlović
* Filip Kurel
* Andrej Papić

---
