const fs = require('fs');
const path = require('path');
async function getConverter() {
  const mod = await import('png-to-ico');
  return mod.default || mod;
}

async function run() {
  const sources = [
    path.join(process.cwd(), '.idx', 'icon.png')
  ].filter(p => fs.existsSync(p));
  if (sources.length === 0) {
    throw new Error('No source PNGs found in public/extension/icons');
  }
  const pngToIco = await getConverter();
  const buf = await pngToIco(sources);
  const outPath = path.join(process.cwd(), 'src', 'app', 'favicon.ico');
  fs.writeFileSync(outPath, buf);
  console.log('Wrote', outPath);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
