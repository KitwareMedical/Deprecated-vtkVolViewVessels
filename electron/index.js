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

function createWindow(portToUse = 8080) {
  if (!mainWindow) {
    mainWindow = new BrowserWindow({ fullscreen: false, icon: `${__dirname}/src/icon.png` });
    mainWindow.loadURL(`http://localhost:${portToUse}`);
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }
}

function startServer(fileToLoad) {
  if (fileToLoad) {
    getPort().then((port) => {
      const cmd = [
        'cd',
        `${__dirname}/web/www`,
        '&&',
        'python',
        '-m SimpleHTTPServer',
        `${port}`,
      ].join(' ');
      server = shelljs.exec(cmd, { async: true });

      if (mainWindow) {
        mainWindow.loadURL(`http://localhost:${port}`);
      } else {
        createWindow(port);
      }


      // server.stdout.on('data', (data) => {
      //   if (data.indexOf('Starting factory') !== -1) {
      //     createWindow(port);
      //   }
      // });
      // server.stderr.on('data', (data) => {
      //   if (data.indexOf('Starting factory') !== -1) {
      //     createWindow(port);
      //   }
      // });
    });
  } else {
    mainWindow = new BrowserWindow({ fullscreen: false, icon: `${__dirname}/src/icon.png` });
    mainWindow.loadURL(`file://${__dirname}/offline.html`);
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }
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
