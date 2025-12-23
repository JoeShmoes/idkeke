const { app, BrowserWindow, shell, nativeImage, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const appIcon = nativeImage.createFromPath(
    path.join(process.cwd(), 'public', 'extension', 'icons', 'icon128.png')
  );
  const buildAppDir = path.join(process.cwd(), 'build');
  const mapPathnameToHtml = (pathname) => {
    const clean = pathname.replace(/^\/+/, '');
    const page = clean === '' ? 'dashboard' : clean;
    return path.join(buildAppDir, `${page}.html`);
  };
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Nexaris Module',
    icon: appIcon.isEmpty() ? undefined : appIcon,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  Menu.setApplicationMenu(null);

  const appUrl = process.env.APP_URL;
  const defaultBuildPage = mapPathnameToHtml('/dashboard');

  if (appUrl) {
    win.loadURL(appUrl);
  } else {
    Promise.resolve()
      .catch(() => win.loadFile(defaultBuildPage))
      .catch(() => win.loadURL('http://localhost:9002/'));
  }

  win.setMenuBarVisibility(false);
  win.webContents.on('will-navigate', (e, url) => {
    try {
      const u = new URL(url);
      const filePath = mapPathnameToHtml(u.pathname);
      e.preventDefault();
      win.loadFile(filePath);
    } catch {
      // If not a valid URL, ignore
    }
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
