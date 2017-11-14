const shelljs = require('shelljs');
const { app, shell, BrowserWindow, dialog, Menu } = require('electron');
const getPort = require('get-port');
const createMenu = require('./menu');

let mainWindow;
let server;

function makeWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: false,
    icon: `${__dirname}/src/icon.png`
  });
  mainWindow.loadURL(`file://${__dirname}/../dist/index.html`);
  mainWindow.openDevTools();
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  makeWindow();
  Menu.setApplicationMenu(createMenu(mainWindow));
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
    makeWindow();
  }
});

// app.setAboutPanelOptions({
//   applicationName: 'ParaViewWeb - Visualizer',
//   copyright: 'Kitware 2017',
// });
