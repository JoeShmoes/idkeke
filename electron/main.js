const { app, BrowserWindow, shell, nativeImage, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const appIcon = nativeImage.createFromPath(
    path.join(__dirname, '../public/extension/icons/icon128.png')
  );
  // Create splash window
  const splash = new BrowserWindow({
    width: 500,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    icon: path.join(__dirname, '../icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splash.loadFile(path.join(__dirname, 'splash.html'));
  splash.center();

  // Create the browser window (hidden initially)
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Don't show until ready
    autoHideMenuBar: true,
    frame: false, // Frameless window to remove top bar
    icon: path.join(__dirname, '../icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Set custom UserAgent to detect desktop app
  win.webContents.setUserAgent(win.webContents.getUserAgent() + ' NexarisDesktop');

  // Inject CSS to hide Home button (back to home link) AND make window draggable
  win.webContents.on('did-finish-load', () => {
    win.webContents.insertCSS(`
      a[href="https://nexarismodule.framer.ai/"] {
        display: none !important;
      }
      /* Make the top area draggable */
      body {
        -webkit-app-region: no-drag;
      }
      /* Assuming there is a header or top bar, make it draggable. 
         If not, we might need to add a dedicated drag bar. 
         For now, let's make a small strip at the top draggable if possible, 
         but since we are loading a remote URL, we can't easily add elements.
         We will rely on the user dragging via empty spaces if any, or just frame: false.
         Warning: frame: false without custom drag region makes it hard to move.
         We'll add a drag region to the top 30px of the body.
      */
      body::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 30px;
        z-index: 9999;
        -webkit-app-region: drag;
        pointer-events: none; /* Let clicks pass through */
      }
    `);
  });

  const startUrl = 'https://nexaris-media-web-app.vercel.app';

  win.loadURL(startUrl);

  // Wait for splash animation (Netflix style takes about 4s)
  setTimeout(() => {
    win.once('ready-to-show', () => {
      splash.destroy();
      win.show();
    });
    // If ready-to-show already fired or takes too long, ensure we show eventually
    if (!win.isVisible() && !splash.isDestroyed()) {
        win.show();
        splash.destroy();
    }
  }, 4000);

  win.setMenuBarVisibility(false);
  win.webContents.on('will-navigate', (e, url) => {
    // Allow navigation within the app
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
