# MXsquid

Cinematic scroll landing for MXsquid — a passion project building the first hyper-realistic motocross simulator.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Story

Scroll through an empty factory: no manufacturers, no investors — then approach the machine under a black cloak. The cloth stirs but never fully comes off. The site ends with a call for engineers, manufacturers, investors, and venues to help develop it.

## Stack

- Vite + React + TypeScript
- React Three Fiber + Drei + Postprocessing
- Lenis smooth scroll

## Mail

Public contact on the site is `hello@mxsquid.co`. Personal address is `aj@mxsquid.co`. Neither mailbox lives at Google Workspace; both forward into a personal Gmail via Cloudflare Email Routing.

## Deploy to mxsquid.co (Vercel)

```bash
npm i -g vercel
cd ~/Desktop/mxsquid-site
vercel login
vercel --prod
```

Then in Vercel → Project → Settings → Domains, add `mxsquid.co` and `www.mxsquid.co`.

## DNS (Cloudflare, domain stays at GoDaddy)

Point GoDaddy nameservers at Cloudflare, then set:

| Type | Name | Value |
|------|------|--------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

Email Routing (Cloudflare) should create the MX records. Add destination Gmail, then routes for `hello@mxsquid.co` and `aj@mxsquid.co`.

SPF (lets Gmail send as the domain):

```
v=spf1 include:_spf.google.com include:_spf.mx.cloudflare.net ~all
```

Propagation can take a few minutes to a few hours.
