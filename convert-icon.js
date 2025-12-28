const fs = require('fs');
const pngToIco = require('png-to-ico');

// Check if pngToIco is the default export or has a default property
const converter = pngToIco.default || pngToIco;

converter('icon.png')
  .then(buf => {
    fs.writeFileSync('icon.ico', buf);
    console.log('icon.ico created');
  })
  .catch(console.error);
