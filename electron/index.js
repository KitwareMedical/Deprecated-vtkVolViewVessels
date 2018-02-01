const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const url = require('url');
const getPort = require('get-port');
const { spawn } = require('child_process');

const createMenu = require('./menu');
const appConfig = require('./config');

const DEBUG = process.env.DEBUG || false;

let mainWindow;
let server;

function startServer() {
  const host = 'localhost';
  return getPort().then((port) => {
    // this is accessed by the renderer process
    process.env.SERVER_HOST = host;
    process.env.SERVER_PORT = port;

    const env = Object.assign({}, process.env);

    // ITK TubeTK paths
    if (appConfig.ITK_ROOT) {
      env.PYTHONPATH = [
        path.join(appConfig.ITK_ROOT, 'Wrapping', 'Generators', 'Python'),
        path.join(appConfig.ITK_ROOT, 'lib'),
        path.join(appConfig.ITK_TUBETK_ROOT, 'TubeTK-build', 'lib'),
      ].join(path.delimiter);
    } else {
      env.PYTHONPATH = [
        path.join(appConfig.ITK_TUBETK_ROOT,
          'ITK-build', 'Wrapping', 'Generators', 'Python'),
        path.join(appConfig.ITK_TUBETK_ROOT, 'ITK-build', 'lib'),
        path.join(appConfig.ITK_TUBETK_ROOT, 'TubeTK-build', 'lib'),
      ].join(path.delimiter);
    }


    if (appConfig.VIRTUALENV) {
      env.PYTHONHOME = appConfig.VIRTUALENV;
    }

    server = spawn(
      appConfig.PYTHON,
      [
        path.join('server', 'server.py'),
        '--port', appConfig.PORT || port,
        '--host', host,
        '--timeout', 2*365*24*60*60, // 2 years; please don't run this for 2 years...
      ],
      {
        cwd: path.join(__dirname, '..'),
        env,
        windowsHide: true,
      },
    );

    server.stdout.on('data', (data) => {
      process.stdout.write(String(data));
    });

    server.stderr.on('data', (data) => {
      process.stdout.write(String(data));
    });

    server.on('close', (data) => {
      server = null;
    });
  });
}

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
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (DEBUG) {
    mainWindow.openDevTools();
  }
}

app.on('ready', () => {
  startServer().then(() => {
    makeWindow();
    Menu.setApplicationMenu(createMenu(mainWindow));
  }).catch((error) => {
    console.error(error);
    exit();
  });
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
