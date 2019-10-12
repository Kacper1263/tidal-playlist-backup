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
        const uuid = backupFromCfg || readline.question("Coppy UUID of your playlist (without brackets) and paste it here, or if you want to backup all type all: ", {defaultInput: "all"})
        if(uuid == "all") backupAllPlaylists(playlists)
        else (backupPlaylist(uuid))
    })
}).catch(e =>{
    console.log(`\nError. Bad login, password or you have problem with network. \nMore info: ${e}`)
    readline.question("\n Press Enter to end...")
})

async function backupAllPlaylists(playlists){
    console.log("\nFetching songs from your playlists...")
    var list = [] //List to backup
    for await(var playlist of playlists){
        var songsList = [];
        await tidal.getPlaylistTracks(playlist.uuid).then(songs =>{
            songs.forEach(song => {
                songsList.push(song.title)
            });
            var title = playlist.title
            list.push({[title]: songsList})
        })
    }
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
                songsList.push(song.title)
            });
            // console.log(`${playlist.title}: `)
            // console.log(util.inspect(songsList, { maxArrayLength: null })) //Log w/o: ...more items

            var title = playlist.title
            var list = {
                [title]: songsList
            }
            saveBackup(list)
        })
    }).catch(e => {
        console.log(`\nError while loading playlist \nMore info: ${e}`) 
        return readline.question("\n Press Enter to end...")
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
    }catch(e){
        console.log(e)
        return readline.question("\n Press Enter to end...")
    }
}