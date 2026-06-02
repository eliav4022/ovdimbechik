const fs = require('fs');
const https = require('https');
const vm = require('vm');

https.get('https://ovdimbechik.co.il/assets/index-XAfc6Hg-.js', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("Downloaded bundle, length:", data.length);
        try {
            const context = { window: {}, document: { createElement: () => ({}), location: {} }, self: {}, global: {}, navigator: {userAgent: ''} };
            vm.createContext(context);
            vm.runInContext(data, context);
            console.log("No syntax errors or immediate eval errors!");
        } catch (e) {
            console.error("Eval error:", e);
        }
    });
});
