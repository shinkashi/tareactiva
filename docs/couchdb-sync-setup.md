# CouchDB Sync Setup Guide

## Current Status

✅ **Client-side sync code implemented**
- PouchDB configured to sync with CouchDB
- Continuous, bidirectional sync enabled
- Retry logic included
- Graceful offline fallback

❌ **Server configuration needed** - CORS blocking sync

## Issues Encountered

### 1. HTTPS Certificate Issue (RESOLVED)
**Problem**: `ERR_CERT_AUTHORITY_INVALID`
- The HTTPS certificate at `https://ocho.ddns.net` is not trusted by browsers
- Self-signed certificates are not accepted

**Solution**: Using HTTP instead
- Changed to `http://ocho.ddns.net:5984/taskel-tasks`

### 2. CORS Issue (NEEDS SERVER FIX)
**Problem**: `CORS policy: No 'Access-Control-Allow-Origin' header`
- Browser blocks requests from `http://localhost:5173` to `http://ocho.ddns.net:5984`
- CouchDB server needs CORS configuration

## Server-Side Configuration Required

### Enable CORS on CouchDB

You need to configure CouchDB to allow cross-origin requests. Here are two methods:

#### Method 1: Using CouchDB Configuration (Recommended)

Add these settings to your CouchDB configuration (usually `/opt/couchdb/etc/local.ini` or via Fauxton admin panel):

```ini
[httpd]
enable_cors = true

[cors]
origins = *
credentials = true
methods = GET, PUT, POST, HEAD, DELETE
headers = accept, authorization, content-type, origin, referer, x-csrf-token
```

After editing, restart CouchDB:
```bash
sudo systemctl restart couchdb
```

#### Method 2: Using curl (Quick Test)

```bash
# Enable CORS
curl -X PUT http://ocho.ddns.net:5984/_node/_local/_config/httpd/enable_cors -d '"true"'

# Set allowed origins (* allows all, or specify your domain)
curl -X PUT http://ocho.ddns.net:5984/_node/_local/_config/cors/origins -d '"*"'

# Set allowed credentials
curl -X PUT http://ocho.ddns.net:5984/_node/_local/_config/cors/credentials -d '"true"'

# Set allowed methods
curl -X PUT http://ocho.ddns.net:5984/_node/_local/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"'

# Set allowed headers
curl -X PUT http://ocho.ddns.net:5984/_node/_local/_config/cors/headers -d '"accept, authorization, content-type, origin, referer, x-csrf-token"'
```

### Create the Database

Ensure the `taskel-tasks` database exists on your CouchDB server:

```bash
# Create database
curl -X PUT http://ocho.ddns.net:5984/taskel-tasks

# Or with authentication if needed
curl -X PUT http://admin:password@ocho.ddns.net:5984/taskel-tasks
```

### Verify CouchDB is Accessible

Test if CouchDB is responding:

```bash
# Check CouchDB version
curl http://ocho.ddns.net:5984/

# Check database exists
curl http://ocho.ddns.net:5984/taskel-tasks
```

Expected response:
```json
{
  "db_name": "taskel-tasks",
  "doc_count": 0,
  "update_seq": "0"
}
```

## Authentication (Optional)

If you want to add authentication to your CouchDB:

### 1. Create a User

```bash
curl -X PUT http://ocho.ddns.net:5984/_users/org.couchdb.user:taskel \
  -H "Content-Type: application/json" \
  -d '{
    "name": "taskel",
    "password": "your_password",
    "roles": [],
    "type": "user"
  }'
```

### 2. Update Client Code

If using authentication, update the URL in `db-cdn.ts`:

```typescript
const COUCHDB_URL = 'http://username:password@ocho.ddns.net:5984/taskel-tasks';
```

## Testing Sync

Once CORS is configured:

1. **Open the app**: Navigate to `http://localhost:5173`
2. **Check console**: Look for "Sync active" or "Sync change" messages
3. **Create a task**: Add a new task in the app
4. **Verify on server**: Check if it appears in CouchDB:
   ```bash
   curl http://ocho.ddns.net:5984/taskel-tasks/_all_docs
   ```

## Sync Features Implemented

- ✅ **Live sync**: Changes sync in real-time
- ✅ **Bidirectional**: Local → Server and Server → Local
- ✅ **Retry logic**: Automatically retries on failure
- ✅ **Offline support**: App works offline, syncs when back online
- ✅ **Conflict handling**: PouchDB handles conflicts automatically

## Sync Events Logged

The client logs these sync events to console:

- `Sync change`: Document changed
- `Sync paused`: Sync paused (usually waiting to retry)
- `Sync active`: Sync is actively running
- `Sync denied`: Permission denied
- `Sync complete`: Sync completed (only for one-time sync)
- `Sync error`: Sync error occurred

## Next Steps

1. **Configure CORS** on ocho.ddns.net CouchDB server
2. **Create taskel-tasks database** if it doesn't exist
3. **Test sync** by creating tasks and checking server
4. **Add sync status indicator** to UI (optional)
5. **Consider authentication** for production use

## Alternative: Reverse Proxy

If you can't modify CouchDB configuration directly, you can set up a reverse proxy (nginx/Apache) to handle CORS:

### Nginx Example

```nginx
location /couchdb/ {
    proxy_pass http://localhost:5984/;

    # CORS headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, PUT, POST, DELETE, HEAD, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'authorization,content-type' always;

    if ($request_method = 'OPTIONS') {
        return 204;
    }
}
```

Then update client URL to:
```typescript
const COUCHDB_URL = 'http://ocho.ddns.net/couchdb/taskel-tasks';
```

## Security Considerations

For production:
- ✅ Use HTTPS with valid certificate
- ✅ Enable authentication
- ✅ Restrict CORS origins to specific domains
- ✅ Set up database-level permissions
- ✅ Use firewall rules to limit access

## Troubleshooting

### "Sync paused" repeatedly
- Check network connection
- Verify CouchDB is running: `curl http://ocho.ddns.net:5984/`
- Check CORS configuration

### "Sync error"
- Check console for detailed error message
- Verify database exists
- Check authentication credentials

### Data not syncing
- Check both local and remote databases
- Look for conflict documents
- Verify sync is active (not cancelled)

## Documentation

- [PouchDB Sync Documentation](https://pouchdb.com/guides/replication.html)
- [CouchDB CORS Setup](https://docs.couchdb.org/en/stable/config/http.html#cross-origin-resource-sharing)
- [CouchDB Security](https://docs.couchdb.org/en/stable/intro/security.html)
