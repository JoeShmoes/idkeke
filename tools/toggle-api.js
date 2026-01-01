
const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '../src/app/api');
const disabledDir = path.join(__dirname, '../src/app/api_disabled');

const mode = process.argv[2]; // 'hide' or 'restore'

if (mode === 'hide') {
  if (fs.existsSync(apiDir)) {
    fs.renameSync(apiDir, disabledDir);
    console.log('Renamed src/app/api to src/app/api_disabled');
  } else {
    console.log('src/app/api not found (already hidden?)');
  }
} else if (mode === 'restore') {
  if (fs.existsSync(disabledDir)) {
    fs.renameSync(disabledDir, apiDir);
    console.log('Renamed src/app/api_disabled to src/app/api');
  } else {
    console.log('src/app/api_disabled not found (already restored?)');
  }
} else {
  console.log('Usage: node tools/toggle-api.js [hide|restore]');
}
