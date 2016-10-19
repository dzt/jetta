const electron = require('electron')
const app = electron.app
const ipcMain = electron.ipcMain
const dialog = require('electron').dialog
const BrowserWindow = electron.BrowserWindow
const autoUpdater = require('./auto-updater')
//const debug = require('debug')
var mainWindow

const debug = /--debug/.test(process.argv[2])

function init() {
  console.log('[Node] App initialization called')
  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 500,
      height: 700,
      minWidth: 500,
      minHeight: 700,
      resizable: true,
      maxWidth: 500,
      maxHeight: 700,
      fullscreenable: false,
      frame: false,
      show: false,
      icon: `${__dirname}/assets/icon.png`
    });

    var http = require('http');
    http.get('http://www.bandcamp.com', function (res) {
      mainWindow.loadURL(`file://${__dirname}/index.html`);
    }).on('error', function(e) {
      mainWindow.loadURL(`file://${__dirname}/noconnection.html`);
    });;

    mainWindow.on('closed', () => {
      mainWindow = null;
      app.quit();
    });
    mainWindow.show();
    if (debug) {
      mainWindow.webContents.openDevTools()
      require('devtron').install()
    }
  }

  app.on('ready', () => {
    createWindow()
    var wintwo = mainWindow;
    autoUpdater.initialize(wintwo)
  })
}

ipcMain.on('open-file-dialog', function (event) {
  dialog.showOpenDialog({
    properties: ['openFile', 'openDirectory']
  }, function (files) {
    if (files) event.sender.send('selected-directory', files)
  })
})

ipcMain.on('download', function (event, link, dir) {
  var jetta = require('./jetta')
  jetta.download(link, dir, event)
})

switch (process.argv[1]) {
  case '--squirrel-install':
    autoUpdater.createShortcut(function () { app.quit() })
    break
  case '--squirrel-uninstall':
    autoUpdater.removeShortcut(function () { app.quit() })
    break
  case '--squirrel-obsolete':
  case '--squirrel-updated':
    app.quit()
    break
  default:
    init();
}
