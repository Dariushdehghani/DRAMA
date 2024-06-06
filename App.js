const express = require('express')
const App = express()
const http = require('http')
const server = http.createServer(App)
const { Server } = require('socket.io')
const io = new Server(server)
const localhost = 56470;
const  {  v4 : uuidv4  }  =  require ( 'uuid' ) ;
const { PeerServer } = require("peer");
const peerServer = PeerServer({ port: 51470, path: "/server/peerserver" });
console.log(' running peer server on: http://localhost:51470/server/peerserver')

//data base
const sqlite = require("sqlite3").verbose();
db = new sqlite.Database('./data/data.sqlite')

App.get('/', (_, res) => {
    res.sendFile(__dirname + '/public/index.html')
})

App.get('/signin', (_, res) => {
    res.sendFile(__dirname + '/public/signin.html')
})

App.get('/home', (_, res) => {
    res.sendFile(__dirname + '/public/home.html')
})

App.get('/sharing_centre', (_, res) => {
    res.sendFile(__dirname + '/public/share_centre.html')
})

App.get('/how_to_use', (_, res) => {
    res.sendFile(__dirname + '/public/documention.html')
})

App.use(express.static('public'))

io.on('connection', socket => {
    console.log('new user, id:' + socket.id)
    socket.on('add_peer_id', ({id, user}) => {
        if (id, user) {
            db.run(`UPDATE users SET key2 = '${id}' , online = 'true' WHERE username = '${user.username}' AND password = '${user.password}'`)
        }
    })
    socket.on('signup_request', arg => {
        if (arg.name.length > 8 && arg.email.length > 8 && arg.password.length > 8) {
            db.get(`SELECT count(*) from users where username = '${arg.name}'`, (err, data) => {
                if (err) {
                    console.log('error line 30')
                } else if (data['count(*)'] > 0) {
                    socket.emit('syntax_error', 'This username exists, please try something else')
                } else {
                    let key3 = uuidv4() + uuidv4()
                    db.run(`INSERT INTO users (key1, key3, username, email, password, online) VALUES ('${socket.id}', '${key3}', '${arg.name}', '${arg.email}', '${arg.password}', 'true' )`)
                    socket.emit('signed_in', {key1: socket.id, key3, username: arg.name, email: arg.email, password: arg.password })
                    console.log(arg.name)
                }
            })
        } else {
            socket.emit('syntax_error', 'heh,heh,heh, the security is higher than you ;)')
        }
    })
    socket.on('login_request', arg => {
        if (arg.name.length > 8 && arg.password.length > 8) {
            db.get(`SELECT *, count(*) FROM users WHERE username = '${arg.name}' AND password = '${arg.password}'`, (err, data) => {
                if(err) {
                    console.log('error in logging in:' + err)
                } else if (data.online === 'true') {
                    socket.emit('syntax_error', 'a user is using this account now')
                }
                 else if (data['count(*)'] > 0) {
                    db.run(`UPDATE users SET key1 = '${socket.id}' , online = 'true' WHERE username = '${arg.name}' AND password = '${arg.password}'`)
                    socket.emit('signed_in', {key1: socket.id, key3: data.key3, username: data.username, email: data.email, password: data.password })
                } else {
                    socket.emit('syntax_error', 'the username or the password is incorrect')
                }
            })
        }
    })
    socket.on('analyse_user_data', data => {
        console.log('analysing: ' + data)
        if (data === null || data === undefined) {
            socket.emit('analyse_request_not_accepted')
        } else {
            db.get(`SELECT count(*) from users WHERE username = '${data.username}' AND email = '${data.email}' AND password = '${data.password}'`, (err, c) => {
                if(err) {
                    console.log('err:' + err)
                } else if (c['count(*)'] < 1) {
                    socket.emit('analyse_request_not_accepted')
                } else {
                    db.run(`UPDATE users SET key1 = '${socket.id}' , online = 'true' WHERE username = '${data.username}' AND password = '${data.password}'`)
                    socket.emit('analyse_request_accepted', data)
                }
            })
        }
    })
    socket.on('search_contact_name', data => {
        if (data === null || data === undefined || data === '') {
            socket.emit('syntax_error', 'what?')
        } else {
            db.get(`SELECT count(*), username, email, key3 FROM users WHERE username = '${data}'`, (err, contact) => {
                if (err) {
                    console.log('err: ' + err)
                } else if (contact['count(*)'] < 1) {
                    socket.emit('syntax_error', 'contact not found, try again')
                } else {
                    socket.emit('found_contact', contact)
                }
            })
        }
    })
    socket.on('search_contact_id', data => {
        if (data === null || data === undefined || data === '') {
            socket.emit('syntax_error', 'what?') 
        } else {
            db.get(`SELECT count(*), username, email, key3 FROM users WHERE key3 = '${data}'`, (err, contact) => {
                if (err) {
                    console.log("err: " + err)
                } else if (contact['count(*)'] < 1) {
                    socket.emit('syntax_error', 'contact not found, try again')
                } else {
                    socket.emit('found_contact', contact)
                }
            })
        }
    })
    socket.on('search_key_for_call',({key, mode}) => {
        db.get(`SELECT count(*), key2, username, online FROM users WHERE key3 = '${key}'`, (err, data) => {
            if (err) {
                console.log('err: ' + err)
            } else if (data['count(*)'] < 1) {
                socket.emit('syntax_error', 'contact not found, mabe S/he has changed the key')
            } else if (data.online === 'false') {
                socket.emit('syntax_error', "sorry, but now we can't connect you, because of " + data.username + " is offline now")
            }else {
                console.log(`accepted a call for ${mode}call request, key: ${data.key2}`)
                if (mode === 'audio') {
                    socket.emit('new_audio_call', {key: data.key2, username: data.username})
                } else if (mode === 'video') {
                    socket.emit('new_video_call', {key: data.key2, username: data.username})
                }
            }
        })
    })
    socket.on('disconnect', () => {
        db.get(`UPDATE users SET online = 'false' WHERE key1 = '${socket.id}'`)
    })
})


server.listen(localhost, () => {
    console.log('we are serving the server now, url: http://localhost:' + localhost)
})

db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS users (key1 char, key2 char, key3 char, username char, email char, password char, online text)')
})