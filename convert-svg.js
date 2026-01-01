const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 512, height: 512, show: false, webPreferences: { offscreen: true } });
  const svgPath = path.join(__dirname, 'Screenshot 2025-11-05 183945.svg');
  await win.loadURL(`file://${svgPath}`);

  // Wait a bit for rendering
  setTimeout(async () => {
    try {
      const image = await win.capturePage();
      const pngBuffer = image.toPNG();
      fs.writeFileSync('icon.png', pngBuffer);
      console.log('icon.png created from SVG');
      app.quit();
    } catch (err) {
      console.error(err);
      app.quit();
    }
  }, 1000);
});
