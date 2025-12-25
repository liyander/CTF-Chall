
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const dns = require('dns');
const util = require('util');
const app = express();
const PORT = 3000;

const dnsLookup = util.promisify(dns.lookup);

// CONFIG
const HMAC_SECRET = 'Curs3d_S3cr3t_K3y_F0r_JWT_S1gn1ng_777';
// Challenge: Forge a token for username: 'tintin' using this secret found in source.

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(cookieParser());

// Database Simulation
let userSettings = {
    theme: 'dark',
    fontSize: 14,
    showBetaFeatures: false
};

// --- UTILS ---
const isObject = obj => obj && obj.constructor && obj.constructor === Object;

// Recursive Merge (Hardened but still vulnerable via constructor.prototype)
function merge(target, source) {
    for (const key in source) {
        // Hardening: Block __proto__ to force players to use constructor.prototype
        if (key === '__proto__') continue;

        if (source[key] && typeof source[key] === 'object') {
            // If target[key] doesn't exist, create it.
            if (!target[key]) {
                target[key] = {};
            }
            merge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

// Is Private IP?
function isPrivateIP(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return false; // IPv6 ignored for simplicity here (or assumed blocked)
    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);

    // 127.x.x.x
    if (first === 127) return true;
    // 10.x.x.x
    if (first === 10) return true;
    // 172.16-31.x.x
    if (first === 172 && second >= 16 && second <= 31) return true;
    // 192.168.x.x
    if (first === 192 && second === 168) return true;
    // 0.0.0.0
    if (first === 0) return true;

    return false;
}

// --- MIDDLEWARE ---
const requireAuth = (req, res, next) => {
    const token = req.cookies.auth_token;
    if (!token) return res.redirect('/login');

    try {
        const decoded = jwt.verify(token, HMAC_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).send('Invalid Token');
    }
};

const ensureGuest = (req, res, next) => {
    if (!req.cookies.auth_token) {
        // Issue Guest Token
        const token = jwt.sign({ username: 'guest', role: 'guest' }, HMAC_SECRET);
        res.cookie('auth_token', token, { httpOnly: true });
        req.user = { username: 'guest', role: 'guest' };
    } else {
        try {
            req.user = jwt.verify(req.cookies.auth_token, HMAC_SECRET);
        } catch (e) {
            // Invalid token, reset to guest
            const token = jwt.sign({ username: 'guest', role: 'guest' }, HMAC_SECRET);
            res.cookie('auth_token', token, { httpOnly: true });
            req.user = { username: 'guest', role: 'guest' };
        }
    }
    next();
};

// --- ROUTES ---

app.use((req, res, next) => {
    // Expose require for "Cursed" reasons (allows RCE if EJS is compromised)
    res.locals.require = require;
    next();
});

// Main Page (Auto Guest Token)
app.get('/', ensureGuest, (req, res) => {
    res.render('index', {
        title: 'Cursed Viewer',
        user: req.user,
        theme: userSettings,
        query: req.query
    });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

// 1. SSRF Public Endpoint (Hardened)
app.get('/api/preview', async (req, res) => {
    let { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing url' });

    try {
        const u = new URL(url);

        // 1. DNS Resolution Check (Protection against direct IP usage)
        const { address } = await dnsLookup(u.hostname);

        // 2. IP Blacklist Check
        if (isPrivateIP(address) || ['127.0.0.1', '::1', '0.0.0.0'].includes(address)) {
            return res.status(403).json({ error: `Host ${u.hostname} resolves to restricted IP ${address}` });
        }

        // 3. Fetch (Vulnerable to DNS Rebinding if attacker controls DNS)
        // or Race Condition if time passes
        console.log(`Fetching ${url} (Resolved: ${address})`);
        const response = await fetch(url);
        const text = await response.text();

        res.json({
            status: response.status,
            preview: text.substring(0, 500)
        });
    } catch (err) {
        res.status(500).json({ error: 'Fetch failed or Invalid URL', details: err.message });
    }
});

// 2. Internal Debug Endpoint
// Only accessible via local loopback
app.get('/internal/debug/source', (req, res) => {
    const remoteIp = req.socket.remoteAddress;
    // Strict Local Check
    if (!remoteIp.includes('127.0.0.1') && remoteIp !== '::1' && !remoteIp.endsWith('127.0.0.1')) {
        return res.status(403).send('Internal Access Only');
    }

    // Leak Source
    const source = fs.readFileSync(__filename, 'utf8');

    // Also leak the admin view template? The user said "analyse code that is in admin.ejs"
    // Let's assume they can infer the existence of admin.ejs from the route below or we leak it too.
    // Let's just leak this file. This file references 'admin' view.

    res.send(source);
});

// 3. Protected Dashboard (The "User Panel")
app.get('/dashboard', requireAuth, (req, res) => {
    // Only 'tintin' allowed to see the "Full" panel? Or anyone?
    // "User can forge token for tintin but can't login as admin"
    // Let's say guest has limited view, tintin has full view.

    if (req.user.role === 'guest') {
        return res.render('guest_dashboard', { user: req.user });
    }

    // Tintin lands here
    res.render('admin', { // Rendering admin.ejs as requested
        user: req.user,
        settings: userSettings
    });
});

// 4. Update Settings (Prototype Pollution)
app.post('/api/settings', requireAuth, (req, res) => {
    const newSettings = req.body;

    // Only logged in non-guests?
    if (req.user.role === 'guest') return res.status(403).json({ error: 'Guests cannot change themes' });

    if (newSettings && typeof newSettings === 'object') {
        merge(userSettings, newSettings); // VULN
        return res.json({ success: true, settings: userSettings });
    }
    res.status(400).json({ error: 'Invalid payload' });
});

app.post('/api/login', (req, res) => {
    // Admin login is broken/disabled
    res.status(401).json({ error: 'Login Service Unavailable. (Hint: Source code might help you bypass this)' });
});

// --- AUTO-RESET MECHANISMS ---
// Reset application state every 30 seconds to clear pollution and prevent permanent crashes
setInterval(() => {
    // 1. Reset User Settings
    userSettings = { theme: 'dark', fontSize: 14, showBetaFeatures: false };

    // 2. Clean Prototype Pollution
    // We explicitly delete known pollution vectors to "heal" the app
    try {
        delete Object.prototype['view options'];
        delete Object.prototype['outputFunctionName'];
        delete Object.prototype['escapeFunction'];
        delete Object.prototype['client'];
        // Also clean any other potential garbage
    } catch (e) {
        console.error('Error cleaning prototype:', e);
    }
    // console.log('--- System Reset (Anti-Pollution) ---');
}, 30000);

// Remove flag from public every 10 seconds
setInterval(() => {
    const pwnedPath = 'public/pwned.txt';
    if (fs.existsSync(pwnedPath)) {
        try {
            fs.unlinkSync(pwnedPath);
            // console.log('--- Flag Removed from Public ---');
        } catch (e) {
            // Ignore errors (e.g. file locked)
        }
    }
}, 10000);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
