# Agent Notes

Project-specific notes for AI coding assistants.

## Convex CLI Quirks

### `npx convex codegen` is NOT local-only

The `codegen` command uploads to your Convex deployment to generate types. This means:
- All environment variables referenced in config files (like `auth.config.ts`) must be set on the deployment first
- You cannot generate types locally without a working deployment connection
- Use `npx convex env set VAR_NAME "value"` to set required env vars before running codegen

```bash
# This will FAIL if SITE_URL isn't set on the deployment:
npx convex codegen

# Set the env var first:
npx convex env set SITE_URL "https://example.com"
npx convex codegen  # Now works
```

### `npx convex deploy` requires interactive input

The `deploy` command prompts for confirmation in interactive terminals. In non-interactive contexts (CI, scripts), it fails.

```bash
# Fails in non-interactive terminals:
npx convex deploy

# Use this for dev deployments instead:
npx convex dev --once
```

### Environment variables in auth config

When using `@convex-dev/auth`, environment variables referenced in `convex/auth.config.ts` must exist on the Convex deployment, not just locally. The nullish coalescing operator (`??`) doesn't help because the build system detects the env var usage statically.

```typescript
// auth.config.ts - SITE_URL must be set on deployment
export default {
  providers: [{
    domain: process.env.SITE_URL,  // Must be set via `npx convex env set`
    applicationID: "convex",
  }],
};
```

### Type regeneration after schema changes

After modifying `convex/schema.ts`, TypeScript types become stale. You must regenerate them:

```bash
# Option 1: Run dev server briefly
npx convex dev --once

# Option 2: Have dev server running in background
npx convex dev
```

Without regeneration, you'll get cryptic TypeScript errors like:
```
Argument of type '"by_email"' is not assignable to parameter of type 'never'
```

### Import scripts need deployment URL

When writing Node.js scripts to call Convex mutations, the `NEXT_PUBLIC_CONVEX_URL` must be set:

```bash
# Read from .env.local and run script
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud node scripts/import.mjs
```

### Convex Auth requires JWT_PRIVATE_KEY AND JWKS (both required)

When using `@convex-dev/auth`, you need BOTH environment variables set with matching keys:

```bash
# Generate both keys together with this Node.js script:
node -e "
const crypto = require('crypto');
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});
const jwk = crypto.createPublicKey(publicKey).export({ format: 'jwk' });
jwk.use = 'sig';
jwk.alg = 'RS256';
jwk.kid = crypto.randomUUID();
console.log('--- Set JWT_PRIVATE_KEY to: ---');
console.log(privateKey);
console.log('--- Set JWKS to: ---');
console.log(JSON.stringify({ keys: [jwk] }));
"

# Then set both via stdin (to avoid CLI parsing issues with dashes):
echo '<private-key-here>' | npx convex env set JWT_PRIVATE_KEY
npx convex env set JWKS '<jwks-json-here>'
```

**Common errors:**
- `Missing environment variable JWT_PRIVATE_KEY` - key not set
- `Missing environment variable JWKS` - JWKS not set
- `"pkcs8" must be PKCS#8 formatted string` - wrong key format (must be PEM)
- `Auth provider discovery failed` - JWKS doesn't match JWT_PRIVATE_KEY

### auth.config.ts domain must use CONVEX_SITE_URL

In `convex/auth.config.ts`, the `domain` field must be `process.env.CONVEX_SITE_URL` (the Convex HTTP endpoint URL), NOT your frontend URL like `SITE_URL`:

```typescript
// CORRECT - use built-in CONVEX_SITE_URL
export default {
  providers: [{
    domain: process.env.CONVEX_SITE_URL,
    applicationID: "convex",
  }],
};
```

```typescript
// WRONG - do not use your frontend URL
export default {
  providers: [{
    domain: process.env.SITE_URL,  // This will cause JWT validation errors!
    applicationID: "convex",
  }],
};
```

`CONVEX_SITE_URL` is a built-in env var (you cannot override it) that points to `https://[deployment].convex.site` where JWKS endpoints are served.
