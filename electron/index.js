const shelljs = require('shelljs');
const { app, shell, BrowserWindow, dialog, Menu } = require('electron');
// const path = require('path');
const getPort = require('get-port');
const aboutPage = require('./aboutPage');

let mainWindow;
let server;

function createMenu() {
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open data file',
          accelerator: 'CmdOrCtrl+O',
          click() { dialog.showOpenDialog(mainWindow, { title: 'Configure ParaView', properties: ['openFile'] }, startServer); },
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

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

function startServer(fileToLoad) {
  mainWindow = new BrowserWindow({ fullscreen: false, icon: `${__dirname}/src/icon.png` });
  mainWindow.loadURL(`file://${__dirname}/../dist/index.html`);
  mainWindow.openDevTools();
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  startServer();
  createMenu();
});

// Quit when all windows are closed.
function exit() {
  if (server) {
    server.kill('SIGINT');
    server = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
  process.exit(0);
}
app.on('window-all-closed', exit);

app.on('activate', () => {
  if (mainWindow === null) {
    startServer();
  }
});

// app.setAboutPanelOptions({
//   applicationName: 'ParaViewWeb - Visualizer',
//   copyright: 'Kitware 2017',
// });
