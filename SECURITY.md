# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| latest  | ✅        |

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues.**

Email **security@buildbase.app** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix (optional)

You will receive an acknowledgement within **48 hours** and a status update within **7 days**.

## Security Best Practices for Template Users

When using this template:

1. **Rotate all secrets** — generate fresh values for `SAAS_CLIENT_SECRET`, `APP_JWT_SECRET`, and `API_SECRET` before deploying.
2. **Never commit `.env.local`** — it is gitignored by default; keep it that way.
3. **Set `NEXT_PUBLIC_SAAS_ORG_ID` and `NEXT_PUBLIC_SAAS_CLIENT_ID`** from your own BuildBase dashboard.
4. **Use strong secrets** — `APP_JWT_SECRET` must be at least 32 random characters (`openssl rand -hex 32`).
5. **Enable branch protection** on your main branch before going public.
6. **Keep dependencies updated** — run `yarn upgrade-interactive` regularly and monitor `yarn audit`.
