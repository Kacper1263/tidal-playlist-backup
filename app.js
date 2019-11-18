const readline = require('readline-sync')
const util = require('util')
const fs = require('fs')
const path = require('path')

const Tidal = require('tidal-api-wrapper')
const tidal = new Tidal()

var loginFromCfg;
var passwordFromCfg;
var backupFromCfg;
checkIsCfg()

var login = loginFromCfg || readline.question("Tidal login: ")
var password = passwordFromCfg || readline.question("Tidal password: ", {hideEchoBack: true})

console.log(`\nLogging in...`)

tidal.login(login, password).then(user =>{
    console.log(`Loading your playlists...`)
    tidal.getPlaylists().then(playlists =>{
        if(!backupFromCfg){
            console.log(`Here are your playlists and their UUIDs: `)
            playlists.forEach(playlist => {
                console.log(` - ${playlist.title}: (${playlist.uuid})`)
            }); 
        }else console.log(`Creating backup of: ${backupFromCfg}\n`) 
        const uuid = backupFromCfg || readline.question("Copy UUID of your playlist (without brackets) and paste it here, or if you want to backup all type all, or favorites: ", {defaultInput: "all"})
        if(uuid == "all") backupAllPlaylists(playlists)
        else if(uuid == "favorites") backupFavorites()
        else (backupPlaylist(uuid))
    }).catch(e =>{
        console.log(`Error while loading playlists. \nMore info: ${e}`)
        readline.keyInPause("\nProgram ended...")
    })
}).catch(e =>{
    saveLog(`Error. Bad login, password or you have problem with network. \nMore info: ${e}`)
    console.log(`\nError. Bad login, password or you have problem with network. \nMore info: ${e}`)
    readline.keyInPause("\nProgram ended...")
})

//Backup all playlists and favorites
async function backupAllPlaylists(playlists){
    var list = [] //List to backup
    //Fetch songs from playlists
    console.log("\nFetching songs from your playlists...")
    for await(var playlist of playlists){
        var songsList = [];
        await tidal.getPlaylistTracks(playlist.uuid).then(songs =>{
            songs.forEach(song => {
                songsList.push(song.title+" - "+song.artist.name)
            });
            var title = playlist.title
            list.push({[title]: songsList})
        }).catch(e =>{
            saveLog(`Error while fetching songs. \nMore info: ${e}`)
            console.log(`Error while fetching songs. \nMore info: ${e}`)
        })
    }
    //Fetch songs from favorites
    console.log("Fetching songs from your favorites...")
    await tidal.getFavoriteTracks().then(favorites =>{

        var songsList = [];
        favorites.forEach(song => {
            songsList.push(song.title+" - "+song.artist.name)
        });

        var title = "Favorites"
        list.push({[title]: songsList})
    }).catch(e => {
        saveLog(`Error while fetching favorites \nMore info: ${e}`)
        console.log(`\nError while fetching favorites \nMore info: ${e}`) 
        return readline.question("\n Press Enter to end...")
    })
    //Save file with both (favorites & playlists)
    saveBackup(list)
}
function backupPlaylist(uuid){
    console.log("\nFetching songs from your playlist...")
    var playlist;
    tidal.getPlaylist(uuid).then(_playlist =>{
        playlist = _playlist
        
        var songsList = [];
        tidal.getPlaylistTracks(uuid).then(songs =>{
            songs.forEach(song => {
                songsList.push(song.title+" - "+song.artist.name)
            });

            var title = playlist.title
            var list = {
                [title]: songsList
            }
            saveBackup(list)
        }).catch(e =>{
            saveLog(`Error while fetching songs. \nMore info: ${e}`)
            console.log(`Error while fetching songs. \nMore info: ${e}`)
        })
    }).catch(e => {
        saveLog(`Error while loading playlist \nMore info: ${e}`)
        console.log(`\nError while loading playlist \nMore info: ${e}`) 
        return readline.keyInPause("\nProgram ended...")
    })
}
function backupFavorites(){
    console.log("\nFetching songs from your favorites...")
    tidal.getFavoriteTracks().then(favorites =>{

        var songsList = [];
        favorites.forEach(song => {
            songsList.push(song.title+" - "+song.artist.name)
        });

        var title = "Favorites"
        var list = {
            [title]: songsList
        }
        saveBackup(list)
    }).catch(e => {
        saveLog(`Error while fetching favorites \nMore info: ${e}`)
        console.log(`\nError while fetching favorites \nMore info: ${e}`) 
        return readline.keyInPause("\nProgram ended...")
    })
}

function checkIsCfg(){
    try{
        var cfg = fs.readFileSync("./cfg.json")
        cfg = JSON.parse(cfg)
        loginFromCfg = cfg.login
        passwordFromCfg = cfg.password
        backupFromCfg = cfg.backup

        if(cfg.login) console.log(`Logging in as ${cfg.login}...`)
        if(cfg.password) console.log('Using password from cfg.json')
    }
    catch{}
}

function saveBackup(list){
    console.log("Saving backup...")
    try{
        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1; //months from 1-12
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();                
        var seconds = dateObj.getSeconds();
        var minutes = dateObj.getMinutes();
        var hour = dateObj.getHours();
        
        //If < 10 - add "0" before. E.g 10:3 -> 10:03
        if(month<10) month = "0"+month
        if(hour<10) hour = "0"+hour
        if(minutes<10) minutes = "0"+minutes
        if(seconds<10) seconds = "0"+seconds

        var newDate = `${day}.${month}.${year}_${hour};${minutes};${seconds}`
        list = JSON.stringify(list, null, 2)
        var saveIn = path.join(`./TidalBackup_${newDate}.txt`)
        fs.writeFileSync(saveIn, list, 'utf8')
        console.log(`Success! File saved with name: TidalBackup_${newDate}`)
        if(!loginFromCfg || !passwordFromCfg || !backupFromCfg)return readline.keyInPause("\nProgram ended...")
    }catch(e){
        saveLog(`Error while saving file. \nMore info: ${e}`)
        console.log(`Error while saving file. \nMore info: ${e}`)
        return readline.keyInPause("\nProgram ended...")
    }
}

function saveLog(_log){
    try{
        //Get time
        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1; //months from 1-12
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();                
        var seconds = dateObj.getSeconds();
        var minutes = dateObj.getMinutes();
        var hour = dateObj.getHours();
        
        //If < 10 - add "0" before. E.g 10:3 -> 10:03
        if(month<10) month = "0"+month
        if(hour<10) hour = "0"+hour
        if(minutes<10) minutes = "0"+minutes
        if(seconds<10) seconds = "0"+seconds

        var newDate = `[${day}.${month}.${year} ${hour}:${minutes}:${seconds}] - `

        //save log
        _log = newDate + _log + "\r\n\r\n"
        var saveIn = path.join(`./errorLog.txt`)
        fs.appendFileSync(saveIn, _log, 'utf8')
    }catch(e){
        console.log(`Error while saving error log. \nMore info: ${e}`)
    }
    
}