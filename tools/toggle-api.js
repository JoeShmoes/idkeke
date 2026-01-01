
const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '../src/app/api');
const hiddenDir = path.join(__dirname, '../src/app/_api');
const oldDisabledDir = path.join(__dirname, '../src/app/api_disabled');

const mode = process.argv[2]; // 'hide' or 'restore'

if (mode === 'hide') {
  if (fs.existsSync(apiDir)) {
    fs.renameSync(apiDir, hiddenDir);
    console.log('Renamed src/app/api to src/app/_api');
  } else if (fs.existsSync(oldDisabledDir)) {
    fs.renameSync(oldDisabledDir, hiddenDir);
    console.log('Renamed src/app/api_disabled to src/app/_api');
  } else if (fs.existsSync(hiddenDir)) {
    console.log('src/app/_api already exists (already hidden)');
  } else {
    console.log('src/app/api not found');
  }
} else if (mode === 'restore') {
  if (fs.existsSync(hiddenDir)) {
    fs.renameSync(hiddenDir, apiDir);
    console.log('Renamed src/app/_api to src/app/api');
  } else if (fs.existsSync(oldDisabledDir)) {
    fs.renameSync(oldDisabledDir, apiDir);
    console.log('Renamed src/app/api_disabled to src/app/api');
  } else if (fs.existsSync(apiDir)) {
    console.log('src/app/api already exists (already restored)');
  } else {
    console.log('Hidden api folder not found');
  }
} else {
  console.log('Usage: node tools/toggle-api.js [hide|restore]');
}
