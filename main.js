const electron = require('electron')
const app = electron.app
const ipcMain = electron.ipcMain
const dialog = require('electron').dialog
const BrowserWindow = electron.BrowserWindow
const autoUpdater = require('./auto-updater')
const {Menu} = require('electron')
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

  function initMenu() {
    // Create menu template. This should shows up on Windows as the window's menu (untested) and it shows up as the app menu on OS X.
    const menuTemplate = [
      {
        label: 'Edit',
        submenu: [
          {
            role: 'undo'
          },
          {
            role: 'redo'
          },
          {
            type: 'separator'
          },
          {
            role: 'cut'
          },
          {
            role: 'copy'
          },
          {
            role: 'paste'
          },
          {
            role: 'pasteandmatchstyle'
          },
          {
            role: 'delete'
          },
          {
            role: 'selectall'
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click (item, focusedWindow) {
              if (focusedWindow) focusedWindow.reload()
            }
          },
          {
            label: 'Toggle Developer Tools',
            accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
            click (item, focusedWindow) {
              if (focusedWindow) focusedWindow.webContents.toggleDevTools()
            }
          },
          {
            type: 'separator'
          }
        ]
      },
      {
        role: 'window',
        submenu: [
          {
            role: 'minimize'
          },
          {
            role: 'close'
          }
        ]
      },
      {
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            click () { require('electron').shell.openExternal('https://github.com/dzt/jetta') }
          }
        ]
      }
    ]

    // If the platform is Mac OS, make some changes to the window management portion of the menu
    if (process.platform === 'darwin') {
      menuTemplate[2].submenu = [
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        },
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Zoom',
          role: 'zoom'
        },
        {
          type: 'separator'
        },
        {
          label: 'Bring All to Front',
          role: 'front'
        }
      ]
    }

    // Set menu template just created as the application menu
    const mainMenu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(mainMenu)
  }

  app.on('ready', () => {
    createWindow()
    initMenu()
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
