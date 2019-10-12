const readline = require('readline-sync')
const util = require('util')
const fs = require('fs')

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

function backupAllPlaylists(playlists){
    playlists.forEach(playlist => {
        var songsList = [];
        tidal.getPlaylistTracks(playlist.uuid).then(songs =>{
            songs.forEach(song => {
                songsList.push(song.title)
            });
            console.log(`${playlist.title}: `)
            console.log(util.inspect(songsList, { maxArrayLength: null })) //Log w/o: ...more items
        })
    })
}
function backupPlaylist(uuid){
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
            try{
                var dateObj = new Date();
                var month = dateObj.getUTCMonth() + 1; //months from 1-12
                var day = dateObj.getUTCDate();
                var year = dateObj.getUTCFullYear();                
                var seconds = dateObj.getSeconds();
                var minutes = dateObj.getMinutes();
                var hour = dateObj.getHours();
                var newdate = `${day}-${month}-${year}_${hour}:${minutes}:${seconds}`
                list = JSON.stringify(list, null, 2)
                fs.writeFileSync(`./TidalBackup-${newdate}.txt`, list)
            }catch(e){
                console.log(e)
            }
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