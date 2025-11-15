### Generate CRUD: nest g resource [name]

### Server with port: 8000

### Client admin with port: 3000

### Client employee with port: 3001

### License configuration

Set the following variables in your `.env` file:

- `LICENSE_KEY`: License string issued to your store.
- `LICENSE_CHECK_URL` (optional): Override for the license API endpoint. Defaults to `https://cs-tech-management-keys.vercel.app/api/check-expiry`.
- `LICENSE_CACHE_TTL_MS` (optional): Milliseconds to reuse the last successful validation. Defaults to 120000 (2 minutes).

The server validates the license on startup and before every request. If the key is missing, expired, or the remote service cannot validate it and no cached result is available, the API responds with `503 Service Unavailable`.