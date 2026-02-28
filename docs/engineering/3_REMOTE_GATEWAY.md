# Connecting to a Remote OpenClaw Gateway (VPS)

This guide covers connecting ClawUI to an OpenClaw gateway running on a remote server (VPS, cloud VM, etc.) instead of `localhost`.

---

## How it works

All OpenClaw traffic is proxied through the Next.js backend:

```
Browser → /api/copilotkit → Next.js server → OPENCLAW_AGENT_URL (your VPS)
```

Only the Next.js process needs network access to the gateway. The browser never connects directly.

---

## Prerequisites

- OpenClaw gateway running on your VPS with `clawg-ui` plugin installed
- Gateway port accessible from wherever the Next.js app runs
- Completed local setup first (see [PAIRING-CLAWG-UI.md](../../PAIRING-CLAWG-UI.md) for the pairing flow)

---

## Option A: SSH Tunnel (recommended for development)

Forward the gateway port to your local machine. No firewall changes, fully encrypted.

```bash
ssh -L 18789:127.0.0.1:18789 user@your-vps-ip
```

Your `.env` stays the same as local development:

```env
OPENCLAW_AGENT_URL=http://127.0.0.1:18789/v1/clawg-ui
```

Keep the SSH session open while developing. Add `-N` to suppress the remote shell if you only need the tunnel:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@your-vps-ip
```

---

## Option B: Direct Connection (simpler, requires firewall)

Expose the gateway port on your VPS and point `OPENCLAW_AGENT_URL` at it directly.

### 1) Open the port on the VPS

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow from YOUR_IP to any port 18789

# firewalld (RHEL/Fedora)
sudo firewall-cmd --add-rich-rule='rule family="ipv4" source address="YOUR_IP" port port="18789" protocol="tcp" accept' --permanent
sudo firewall-cmd --reload
```

Restrict to your IP or your deployment server's IP — never open to `0.0.0.0/0`.

### 2) Update `.env`

```env
OPENCLAW_AGENT_URL=http://YOUR_VPS_IP:18789/v1/clawg-ui
```

---

## Option C: Reverse Proxy with TLS (recommended for production)

Put nginx or Caddy in front of the gateway for HTTPS.

### Caddy (automatic TLS)

```
openclaw.yourdomain.com {
    reverse_proxy 127.0.0.1:18789
}
```

### nginx

```nginx
server {
    listen 443 ssl;
    server_name openclaw.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/openclaw.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/openclaw.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

Then in `.env`:

```env
OPENCLAW_AGENT_URL=https://openclaw.yourdomain.com/v1/clawg-ui
```

---

## Pairing with a remote gateway

The pairing flow is the same as local — just target the remote address.

### 1) Request a pairing token

```bash
curl -i http://YOUR_VPS_IP:18789/v1/clawg-ui \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"pair"}]}'
```

If using an SSH tunnel, use `127.0.0.1:18789` instead.

Save the `token` from the response immediately — it is only returned once.

### 2) Approve on the VPS

SSH into your VPS and run:

```bash
openclaw pairing approve clawg-ui <PAIRING_CODE>
```

### 3) Update `.env`

```env
CLAWPILOT_MODE=openclaw          # or hybrid
NEXT_PUBLIC_CLAWPILOT_MODE=openclaw
OPENCLAW_AGENT_URL=http://YOUR_VPS_IP:18789/v1/clawg-ui
OPENCLAW_AGENT_TOKEN=<TOKEN_FROM_STEP_1>
```

### 4) Verify

```bash
curl -i http://YOUR_VPS_IP:18789/v1/clawg-ui \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"ping"}]}'
```

A successful response (no `401`) confirms the connection.

---

## Deployment topologies

### App local, gateway on VPS

```
Your machine                          VPS
┌──────────────┐    internet    ┌──────────────────┐
│  ClawUI      │ ────────────► │  OpenClaw Gateway │
│  (Next.js)   │               │  :18789           │
│  :3000       │               │  clawg-ui plugin  │
└──────────────┘               └──────────────────┘
```

Use Option A (SSH tunnel) or Option B (direct).

### Both on the same VPS

```
VPS
┌─────────────────────────────────────┐
│  ClawUI (Next.js)   :3000           │
│         │                           │
│         ▼                           │
│  OpenClaw Gateway   :18789          │
│  (127.0.0.1 — no firewall needed)  │
└─────────────────────────────────────┘
```

```env
OPENCLAW_AGENT_URL=http://127.0.0.1:18789/v1/clawg-ui
```

No port exposure needed — both processes communicate over loopback.

### App on Vercel/Netlify, gateway on VPS

```
Vercel                              VPS
┌──────────────┐    internet    ┌──────────────────┐
│  ClawUI      │ ────────────► │  OpenClaw Gateway │
│  (serverless)│               │  :443 (TLS)       │
└──────────────┘               └──────────────────┘
```

Use Option C (reverse proxy with TLS). Serverless environments require a publicly reachable HTTPS endpoint.

```env
OPENCLAW_AGENT_URL=https://openclaw.yourdomain.com/v1/clawg-ui
```

---

## Security checklist

| Concern | Recommendation |
|---------|---------------|
| Port exposure | Restrict `18789` to known IPs; never open to `0.0.0.0/0` |
| Transport | Use TLS in production (Option C) |
| Token storage | Keep `OPENCLAW_AGENT_TOKEN` server-side only; never use the `NEXT_PUBLIC_` prefix |
| SSH tunnel | Best for dev — zero exposed ports, encrypted by default |
| Token rotation | If a token leaks, re-pair to generate a new one |
| Firewall | Use allowlists, not blocklists |

---

## Common issues

### `Connection refused`

Gateway is not reachable from the Next.js process.

- Verify the VPS port is open: `nc -zv YOUR_VPS_IP 18789`
- Check gateway is running: `openclaw gateway status` (on VPS)
- If using SSH tunnel, confirm the tunnel is still active

### `ETIMEDOUT` / `EHOSTUNREACH`

Network path is blocked.

- Check VPS firewall rules
- Check cloud provider security groups (AWS SG, GCP firewall rules, etc.)
- Verify you can reach the VPS at all: `ping YOUR_VPS_IP`

### `401 unauthorized` after moving to VPS

Token is gateway-specific. A token paired against a local gateway won't work on a different gateway instance.

- Re-run the pairing flow targeting the VPS gateway
- Update `OPENCLAW_AGENT_TOKEN` in `.env`

### Latency feels high

The request path is: Browser → Next.js → VPS gateway → LLM → back.

- Co-locate app and gateway on the same VPS to cut one network hop
- Use a VPS region close to your LLM provider's endpoint
- Consider `hybrid` mode so local LLM queries skip the VPS entirely
