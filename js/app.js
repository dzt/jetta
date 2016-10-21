const os = require('os');
const remote = require('electron').remote;
const BrowserWindow = remote.BrowserWindow;
const ipcRenderer = require('electron').ipcRenderer;
const path = require('path');
const CurrentWindow = remote.getCurrentWindow()
const shell = require("electron").shell
const $ = require('jquery');
var dir
const base = 'http://www.supremenewyork.com';

var alreadyRunningBotService = false;
var hasBeenOn = false

// syncs settings with interface TODO
settings.sync();

const platforms = {
    WINDOWS: 1,
    MAC: 2,
    LINUX: 3
};

if (os.platform() == 'win32') {
    var platform = platforms.WINDOWS;
    $(".topbar .mac").hide();
} else if (os.platform() == 'darwin') {
    var platform = platforms.MAC;
    $(".topbar .windows").hide();
} else {
    var platform = platforms.LINUX;
}

dir = settings.settings.save.dir

const pjson = require('././package.json')
$('#footerstatus').html(`Version ${pjson.version}`);

// Go to Main Page if Get Started Button has been clicked
$('.main').show();

$('.topbar .close').click(() => {
    ipcRenderer.send('shutdown');
    ipcRenderer.removeAllListeners();
    const window = BrowserWindow.getFocusedWindow();
    window.close();
});

$('.topbar .minimize').click(() => {
    const window = BrowserWindow.getFocusedWindow();
    window.minimize();
});

$('.topbar .mac .max').click(() => {
    // TODO
});

// open Filder Dir
const selectDirBtn = document.getElementById('select-directory')

selectDirBtn.addEventListener('click', function(event) {
    ipcRenderer.send('open-file-dialog')
})

ipcRenderer.on('selected-directory', function(event, path) {
    console.log(`${path}`)
    dir = path
    console.log(typeof dir)
    settings.settings.save.dir = path
  	settings.save()
    $('.filename').html(path)
})

ipcRenderer.on('updateBtn', function(event, msg) {
    $('#downloadBtn').val(msg)
})

$('#downloadBtn').click(() => {
    var link = $('#link').val()
    console.log(link)
    ipcRenderer.send('download', link, dir, CurrentWindow)
    $('#downloadBtn').val('Initializing...')
});

$('#paste').click(() => {
    var link = $('#link').val('http://blankbanshee.bandcamp.com/album/mega')
    console.log(link)
});

$('#openBtn').click(() => {
    console.log(os.homedir())
    shell.openItem(dir.toString())
});

$('#gh').click(() => {
    shell.openExternal('https://github.com/dzt/jetta')
});

var $logsContainer = document.getElementById( "tracks" );
// Dispplay Tracks with progress and whatnot lmao
function display_progress(data) {
    if (data.id === parseInt(data.id)) {
        if ($('#track_' + data.id).length) {
            $('#track_' + data.id).html(data.progress);
        } else {
            $('<li id="track_' + data.id + '">' + '<span>' + data.progress + '</span>' + '</li>').appendTo("#tracks");
        }
        $('h1').html(data.progress);
    } else {
    }
}

ipcRenderer.on('progress', function(event, data) {
    display_progress(data);
});

var modifiedDir
ipcRenderer.on('folder', function(event, data) {
  if (os.platform() == 'win32') {
    console.log(data)
    modifiedDir = dir + '\\' + data.artist + '\\' + data.album
    console.log(modifiedDir)
    dir = modifiedDir
  } else if(os.platform() == 'darwin') {
    console.log(data)
    modifiedDir = dir + '/' + data.artist + '/' + data.album
    console.log(modifiedDir)
    dir = modifiedDir
  }
});
