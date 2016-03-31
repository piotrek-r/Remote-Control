const fs = require('fs');
const manifest = require('../config/manifest.global');

fs.writeFileSync(__dirname + '/../extension/content.js', fs.readFileSync(__dirname + '/../src/content.js'));

fs.writeFileSync(__dirname + '/../extension/manifest.json', JSON.stringify(manifest, null, 2));
