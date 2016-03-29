const packageInfo = require('../package.json');

module.exports = {
  "manifest_version": 2,
  "name": "Remote Control",
  "version": packageInfo.version,
  "short_name": "Remote Control",
  "description": "Remote Control chrome client",
  "author": "Piotr Rybałtowski <piotrek@owl-labs.com>",
  "icons": {
    "128": "128-icon.png"
  },
  "content_scripts": [
    {
      "matches": [
        "http://*/*"
      ],
      "js": [
        "content.js"
      ]
    }
  ]
};
