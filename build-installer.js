const electronInstaller = require('electron-winstaller');
const path = require('path');

async function build() {
  console.log('Creating windows installer...');
  try {
    await electronInstaller.createWindowsInstaller({
      appDirectory: path.join(__dirname, 'dist-packager', 'Nexaris Module-win32-x64'),
      outputDirectory: path.join(__dirname, 'dist-installer'),
      authors: 'Nexaris',
      exe: 'Nexaris Module.exe',
      setupExe: 'NexarisModuleSetup.exe',
      setupIcon: path.join(__dirname, 'icon.ico'),
      noMsi: true,
      description: 'Nexaris Module Desktop App'
    });
    console.log('Installer created successfully!');
  } catch (e) {
    console.log(`Error creating installer: ${e.message}`);
    process.exit(1);
  }
}

build();
