const readline = require('readline-sync')
const util = require('util')

const Tidal = require('tidal-api-wrapper')
const tidal = new Tidal()

var login = readline.question("Tidal login: ")
var password = readline.question("Tidal password: ", {hideEchoBack: true})

console.log(`\nLogging in...`)

tidal.login(login, password).then(user =>{
    console.log(`Loading your playlists...`)
    tidal.getPlaylists().then(playlists =>{
        console.log(`Here are your playlists and their UUIDs: `)
        playlists.forEach(playlist => {
            console.log(` - ${playlist.title}: (${playlist.uuid})`)
        });    
        const uuid = readline.question("Coppy UUID of your playlist (without brackets) and paste it here, or if you want to backup all type all: ", {defaultInput: "all"})
        if(uuid == "all") backupAllPlaylists(playlists)
        else (backupPlaylist(uuid))
    })
}).catch(e =>{
    console.log(`Error. Bad login, password or you have problem with network. \nMore info: ${e}`)
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
    })
    var songsList = [];
    tidal.getPlaylistTracks(uuid).then(songs =>{
        songs.forEach(song => {
            songsList.push(song.title)
        });
        console.log(`${playlist.title}: `)
        console.log(util.inspect(songsList, { maxArrayLength: null })) //Log w/o: ...more items
    })
}