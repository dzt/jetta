var api = {};
var url_functions = require('url');
var http = require('http');
var fs = require('fs');
var os = require('os');
var electron = require('electron');
var BrowserWindow = electron.BrowserWindow;
var ipc = electron.ipcMain;
var shell = electron.shell;

var jetta = {};

jetta.download = function(link, dir, event) {
    var mainWindow = BrowserWindow.fromWebContents(event.sender)
    var window = mainWindow;
    var sender = mainWindow.webContents;
    var bandcamp_url = url_functions.parse(link);

    init(bandcamp_url)

    var options = {
        host: bandcamp_url.host,
        path: bandcamp_url.path
    };

    function init(options) {
        var request = http.request(options, function(res) {
            var data = '';
            res.on('data', function(chunk) {
                data += chunk;
            });
            res.on('end', function() {
                scan_page(data);
            });
        });
        request.on('error', function(e) {
            console.log("Error on init: " + e.message);
        });
        request.end();
    }

    function scan_page(data) {
        var pattern = new RegExp(/artist: \"(.*?)\"\,/);
        var matches = data.match(pattern);
        var artist = matches[1];
        var track_info = [];

        pattern = new RegExp(/album_title: \"(.*?)\"\,/);
        matches = data.match(pattern);
        var album = matches[1];

        pattern = new RegExp(/\[{(.*?)"encoding_pending(.*?)}]/);
        matches = data.match(pattern);

        try {
            var tracks = JSON.parse(matches[0]);
        } catch (e) {
            console.warn('Bad user input', matches[0], e);
        }

        console.log("Downloading Tracks from " + artist + "'s album " + album);
        sender.send('updateBtn', 'Downloading...');
        // if (!fs.existsSync(dir)) {
        //     fs.mkdirSync(dir);
        // }

        //creates artist directory
        if (os.platform() == 'win32') {
            console.log(dir + '\\' + artist)
            if (!fs.existsSync(dir + '\\' + artist)) {
                fs.mkdirSync(dir + '\\' + artist);
            } else {
                console.log(artist + ' directory already exists.')
            }
            if (!fs.existsSync(dir + '\\' + artist + "\\" + album)) {
                fs.mkdirSync(dir + '\\' + artist + "\\" + album);
            }
        } else if (os.platform() == 'darwin') {
            console.log(dir + '/' + artist)
            if (!fs.existsSync(dir + '/' + artist)) {
                fs.mkdirSync(dir + '/' + artist);
            } else {
                console.log(artist + ' directory already exists.')
            }
            if (!fs.existsSync(dir + '/' + artist + "/" + album)) {
                fs.mkdirSync(dir + '/' + artist + "/" + album);
            }
        }

        var albumInfo = {
          artist: artist,
          album: album
        }

        sender.send('folder', albumInfo);

        for (var i = 0; i < tracks.length; i++) {
            try {
                if (tracks[i].file["mp3-128"].substr(0, 4) != "http") {
                    tracks[i].file["mp3-128"] = "http:" + tracks[i].file["mp3-128"];
                }
                track_info = {
                    "id": i,
                    "artist": artist,
                    "album": album,
                    "track": tracks[i].title,
                    "stream": tracks[i].file["mp3-128"]
                };
                save_track(track_info);
            } catch (e) {
                console.log(track_info);
                sender.send('updateBtn', 'Download');
            }
        }
    }

    function save_track(track_info) {

        http.get(track_info.stream, function(res) {
            track_uri = res.headers.location;
            http.get(track_uri, function(response) {
                //updates track_info with file size
                track_info.size = (response.headers['content-length']);
                var folder

                if (os.platform() == 'win32') {
                    folder = dir + '\\' + track_info.artist + "\\" + track_info.album + '\\';
                } else if (os.platform() == 'darwin') {
                    folder = dir + '/' + track_info.artist + "/" + track_info.album + '/';
                }
                var file_name = (track_info.artist + " - " + track_info.track + ".mp3").replace(/\//g, "");
                response.pipe(fs.createWriteStream(folder + file_name));
                console.log(folder + file_name);
                setTimeout(function() {
                    send_progress(track_info)
                }.bind(track_info), 1000);
                sender.send('updateBtn', 'Download');
            })
        }.bind(track_info)).on('error', function(e) {
            console.log("Got error: " + e.message);
            sender.send('updateBtn', 'Download');
        });

    }

    function send_progress(track_info) {
        //displays the progress by comparing the content-length with filesize on disk
        if (os.platform() == 'win32') {
            var folder = dir + '\\' + track_info.artist + "\\" + track_info.album + '\\';
        } else if (os.platform() == 'darwin') {
            var folder = dir + '/' + track_info.artist + "/" + track_info.album + '/';
        }
        var file_name = (track_info.artist + " - " + track_info.track + ".mp3").replace(/\//g, "");
        console.log(folder + file_name)
        var stats = fs.statSync(folder + file_name);
        if (stats.isFile()) {
            var progress = parseInt(parseFloat(stats["size"] / track_info.size) * 100);
            console.log(track_info.track + ': ' + progress + '%');

            sender.send('progress', { "id": track_info.id, "progress": track_info.track + ': ' + progress + '%' });
            //send to the browser (id for list element)
            if (progress != 100) {
                setTimeout(function() {
                    send_progress(track_info)
                }.bind(track_info), 1000);
            }
        } else {
            setTimeout(function() {
                send_progress(track_info)
            }.bind(track_info), 1000);
        }
    }
}

module.exports = jetta;
