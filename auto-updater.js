const pjson = require('./package.json')
const path = require('path')
const ChildProcess = require('child_process')
const electron = require('electron')
const ipcMain = electron.ipcMain
const debug = /--debug/.test(process.argv[2])
// accepted values: `osx`, `win32`
const platform = process.platform === 'darwin' ?
  'osx' :
  process.platform;

var state = 'checking'
exports.initialize = function (mainWindow) {

  var autoUpdater = require('electron').autoUpdater;

  ipcMain.on('autoUpdateInit', function(event){

    const electron = require('electron')
    const ipcMain = electron.ipcMain;
    const app = electron.app;
    const sender = mainWindow.webContents;
    const dialog = require('electron').dialog;

    if (debug) {
      return
    }

    console.log(`${platform}`)
    console.log(`${pjson.version}`)

    function createDialog(title, message) {
      const options = {
        type: 'info',
        title: title,
        message: message,
        buttons: ['Ok']
      }
      dialog.showMessageBox(options, function (index) {
        event.sender.send('information-dialog-selection', index)
      })
    }

    console.log(`https://jetta-updater.herokuapp.com/update/${platform}/${pjson.version}`)
    autoUpdater.setFeedURL(`https://jetta-updater.herokuapp.com/update/${platform}/${pjson.version}`);
    autoUpdater.checkForUpdates();

    autoUpdater.on('error', function(event) {
        console.log('checking-for-update');
        createDialog('Error', 'Error occured while seeking for the latest update of sScout, try restarting.')
    });

    autoUpdater.on('checking-for-update', function(event) {
        console.log('checking-for-update');
    });

    autoUpdater.on('update-not-available', function(event) {
        console.log('update-not-available');
    });

    autoUpdater.on('update-available', function(event) {
        console.log('Downloading Latest Update');
        sender.send('autoUpdateStatus', {status: 'downloading', data: null});
    });

    autoUpdater.on('update-downloaded', function(event) {
        console.log(`Updated Downloaded ${event}`);
        sender.send('autoUpdateStatus', {status: 'downloaded', data: null});
    });

  });

  ipcMain.on('update', function(event){
    console.log('update button clicked')
    autoUpdater.quitAndInstall();
  });

}

exports.createShortcut = function (callback) {
  spawnUpdate([
    '--createShortcut',
    path.basename(process.execPath),
    '--shortcut-locations',
    'StartMenu'
  ], callback)
}

exports.removeShortcut = function (callback) {
  spawnUpdate([
    '--removeShortcut',
    path.basename(process.execPath)
  ], callback)
}

function spawnUpdate (args, callback) {
  var updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe')
  var stdout = ''
  var spawned = null

  try {
    spawned = ChildProcess.spawn(updateExe, args)
  } catch (error) {
    if (error && error.stdout == null) error.stdout = stdout
    process.nextTick(function () { callback(error) })
    return
  }

  var error = null

  spawned.stdout.on('data', function (data) { stdout += data })

  spawned.on('error', function (processError) {
    if (!error) error = processError
  })

  spawned.on('close', function (code, signal) {
    if (!error && code !== 0) {
      error = new Error('Command failed: ' + code + ' ' + signal)
    }
    if (error && error.code == null) error.code = code
    if (error && error.stdout == null) error.stdout = stdout
    callback(error)
  })
}
