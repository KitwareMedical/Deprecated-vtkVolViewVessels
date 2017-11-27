const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const url = require('url');
const getPort = require('get-port');
const createMenu = require('./menu');

let mainWindow;
let server;

function makeWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: false,
    icon: path.join(__dirname, 'src', 'icon.png'),
  });
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '..', 'dist', 'index.html'),
    protocol: 'file:',
    slashes: true,
  }));
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
