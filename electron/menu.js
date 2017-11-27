const { app, shell, dialog, Menu } = require('electron');
const aboutPage = require('./aboutPage');

module.exports = function createMenu(mainWindow) {
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open data file',
          accelerator: 'CmdOrCtrl+O',
          click() {
            dialog.showOpenDialog(
                mainWindow,
                {
                  title: 'Open file...',
                  properties: ['openFile'],
                },
                (fileToLoad) => {
                  if (fileToLoad) {
                    const [filename] = fileToLoad;
                    mainWindow.webContents.send('openFile', filename);
                  }
                },
            );
          },
        },
        {
          label: 'Save tubes...',
          accelerator: 'CmdOrCtrl+S',
          click() {
            dialog.showSaveDialog(
                mainWindow,
                {
                  title: 'Save tubes',
                  filters: [
                    { name: '.tre', 'extensions': ['tre'] },
                  ],
                },
                (filename) => {
                  if (filename) {
                    mainWindow.webContents.send('saveTubes', filename);
                  }
                },
            );
          },
        },
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click() { shell.openExternal('https://github.com/KitwareMedical/itk-tube-web'); },
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    const name = app.getName();
    menuTemplate.unshift({
      label: name,
      submenu: [
        aboutPage,
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  } else {
    menuTemplate[menuTemplate.length - 1].submenu.push(aboutPage);
  }

  return Menu.buildFromTemplate(menuTemplate);
}
