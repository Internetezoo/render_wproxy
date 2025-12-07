const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const url = require('url');

const app = express();
// A Render platform a PORT környezeti változót használja
const PORT = process.env.PORT || 10000;

// ====================================================================
// FŐ PROXY LOGIKA: /proxy VÉGPONT
// ====================================================================
app.use('/proxy', (req, res, next) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send("Hiányzó 'url' paraméter. Használat: /proxy?url=https://celoldal.com");
    }

    let targetHost;
    try {
        // Ellenőrizzük az URL érvényességét
        targetHost = new URL(targetUrl);
    } catch (e) {
        return res.status(400).send("Érvénytelen URL formátum.");
    }
    
    // Proxy beállítások
    const proxyOptions = {
        target: targetHost.origin, // A céloldal alap URL-je (pl. https://tubitv.com)
        changeOrigin: true, // A céloldal számára úgy tűnik, mintha a Render küldené a kérést
        
        // Útvonal újraírása: a /proxy utáni útvonalat és query paramétereket használja
        pathRewrite: (path, req) => targetHost.pathname + targetHost.search,
        
        onProxyReq: (proxyReq, req, res) => {
            // Átírja a Host fejlécet, hogy a céloldal hite legyen
            proxyReq.setHeader('Host', targetHost.host);
        },
        logLevel: 'info',
        ws: true // Engedélyezi a WebSocket proxyzást is
    };

    createProxyMiddleware(proxyOptions)(req, res, next);
});

// Alapértelmezett főoldal
app.get('/', (req, res) => {
    res.send('<h1>Render Reverse Proxy Service</h1><p>Fut. Használat: /proxy?url=https://celoldal.com</p>');
});

app.listen(PORT, () => {
    console.log(`Proxy server fut a http://localhost:${PORT} porton`);
});
