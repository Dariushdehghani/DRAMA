var switch1 = false
var switch2 = false

window.onload = () => {
    let data = localStorage.getItem('user')
    if (data) {
        socket.emit('analyse_user_data', JSON.parse(data))
    } else {
        window.location.href = '/signin'
    }
    if (localStorage.getItem('theme') === 'dark') {
        document.getElementById('body_elem').style.backgroundColor = 'black'
        document.getElementById('add_new_conversate_window').style.backgroundColor = '#252525'
        document.getElementById('switch_theme_input').setAttribute('checked', '')
        switch2 = true
    } else {
        document.getElementById('body_elem').style.backgroundColor = 'white'
    }

    // choose theme colors 
    change_theme(localStorage.getItem('theme_color'))
    
    //refresh contacts
    refresh_contacts()

    let ui = document.getElementById('user_img')
    ui.style.backgroundColor = colors[Math.floor(Math.random() * 10)]
    ui.innerHTML = JSON.parse(data).username.slice(0,1).toUpperCase()
}

function change_theme_color(color) {
    change_theme(color)
    localStorage.setItem('theme_color', color)
}

peer.on('open', id => {
    let user = JSON.parse(localStorage.getItem('user'))
    socket.emit('add_peer_id', {id, user})
    user.key1 = socket.id
    user.key2 = id
    let new_data = JSON.stringify(user)
    localStorage.setItem('user', new_data)
})

socket.on('analyse_request_accepted', data => {
    document.querySelector('#name_place').innerHTML = data.username
    document.getElementById('my_name_place').innerHTML = data.username
})

socket.on('analyse_request_not_accepted', () => {
    alert('unvaliuable saved data: the saved data on your device is fake, please login or signup again to continue working')
    window.location.href = '/signin'
})

socket.on('syntax_error', data => {
    alert(data)
})

function toggle_between_name_id() {
    if (switch1) {
        switch1 = false
        document.getElementById('ancw_name_inp').placeholder = "type contact's name"
    } else {
        switch1 = true
        document.getElementById('ancw_name_inp').placeholder = "type contact's id"
    }
}

function toggle_dark_theme() {
    if (switch2) {
        switch2 = false
        document.getElementById('body_elem').style.backgroundColor = 'white'
        document.getElementById('add_new_conversate_window').style.backgroundColor = 'white'
        localStorage.setItem('theme', 'light')
    } else {
        switch2 = true
        document.getElementById('body_elem').style.backgroundColor = 'black'
        document.getElementById('add_new_conversate_window').style.backgroundColor = '#252525'
        localStorage.setItem('theme', 'dark')
    }
}

function open_new_conversate_window() {
    document.getElementById('island_card_1').style.display = 'flex'
}

function show_user_keys() {
    let data = JSON.parse(localStorage.getItem('user'))
    document.getElementById('island_card_2').style.display = 'flex'
    document.getElementById('keys_show_ctx').innerHTML = `<p style='color: white;'>first key: <b>${data.key1}</b> <br /> second key: <b>${data.key2}</b> <br /> third key: <b>${data.key3}</b></p>`
}

function search_contact() {
    let data = document.getElementById('ancw_name_inp').value
    if (data) {
        if (switch1 === false) {
            socket.emit('search_contact_name', data)
        } else {
            socket.emit('search_contact_id', data)
        }
    } else {
        alert('empty input or unavailable data')
    }
}

function refresh_contacts() {
    let contacts_ctx = document.getElementById('msgs_ctx')
    contacts_ctx.innerHTML = ''
    let contactsJs = localStorage.getItem('contacts') ? localStorage.getItem('contacts').split('po/d/do/dra') : [];
    for (let contactJs of contactsJs) {
        let contact = JSON.parse(contactJs)
        contacts_ctx.innerHTML += `<div class="msg_card">
        <div style="width: 80%;display: flex;flex-direction: row;align-items: center;" >
            <div style="border-radius: 50%;height: 40px;width: 40px;background-color: ${colors[Math.floor(Math.random() * 10)]};border: 1px solid white;display:flex;justify-content:center;align-items:center;">${contact.username.slice(0,2).toUpperCase()}</div>
            <div class='detail' >
                <h4 class="msg_card_nsp">${contact.username}</h4>
                <p style="color: white;opacity: 0.6;">${contact.email}</p>
            </div>
        </div>
        <div style="width: 20%;justify-content: right;display: flex;align-items: center;padding-right: 2%;gap: 4px;" >
            <button class="circle_shadow_btn" onclick="new_video_call('${contact.key3}')">🎥</button>
            <button class="circle_shadow_btn" onclick="new_audio_call('${contact.key3}')">📞</button>
        </div>
    </div>`
    }
}

socket.on('found_contact', contact => {
    document.getElementById('ancw_name_inp').value = ''
    document.getElementById('island_card_1').style.display = 'none'
    let old_data = localStorage.getItem('contacts')
    if (old_data) {
        let new_data = old_data + 'po/d/do/dra' + JSON.stringify(contact)
        localStorage.setItem('contacts', new_data)
    } else {
        localStorage.setItem('contacts', JSON.stringify(contact))
    }
    refresh_contacts()
})

function new_audio_call(key) {
    socket.emit('search_key_for_call', {key, mode: 'audio'})
}

function new_video_call(key) {
    socket.emit('search_key_for_call', {key, mode: 'video'})
}

socket.on('new_audio_call', ({key, username}) => {
    let user = JSON.parse(localStorage.getItem('user'))
    let conn = peer.connect(key)
    conn.on('open', () => {
        conn.send({
            title: 'new_call',
            caller: user.username,
            start: Date(),
            type: 'audio_call'
        })
    })
    document.getElementById('island_card_4').style.display = 'flex'
    document.getElementById('wait_for_connection').style.display = 'block'
    document.getElementById('call_connection_request').style.display = 'none'
    conn.on('data', data => {
        if (data.title === 'call_accepted') {
            document.getElementById('someone_name_place').innerHTML = username
            document.getElementById('msgs_ctx').style.display = 'none'
            document.getElementById('call_ctx').style.display = 'block'
            document.getElementById('island_card_4').style.display = 'none'
            navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
            }).then(stream => {
                console.log('calling : ' + key)
                let v =document.getElementById('my_video_place')
                v.srcObject = stream
                v.muted = true
                let call = peer.call(key, stream)
                call.on('stream', user_viveo_stream => {
                    let remote_v = document.getElementById('someone_video_place')
                    remote_v.srcObject = user_viveo_stream
                })
                conn.on('data', data => {
                    if (data.title === 'end_call_in_call') {
                        document.getElementById('island_card_4').style.display = 'none'
                        document.getElementById('msgs_ctx').style.display = 'block'
                        document.getElementById('call_ctx').style.display = 'none'
                        stream.getTracks().forEach(function(track) { track.stop(); })
                    }else if (data.title === 'update_notes_incall') {
                        document.getElementById('call_txt_note').value = data.data
                    }
                })
                document.getElementById('end_call_in_call_btn').addEventListener('click' ,() => {
                    conn.send({
                        title: 'end_call_in_call'
                    })
                    document.getElementById('island_card_4').style.display = 'none'
                    document.getElementById('msgs_ctx').style.display = 'block'
                    document.getElementById('call_ctx').style.display = 'none'
                    stream.getTracks().forEach(function(track) { track.stop(); })
                    conn.close()
                    reject_call_ui()
                })
                document.getElementById('add_a_new_idea_incall').addEventListener('click', () => {
                    let name = document.getElementById('idea_name_incall')
                    let detail = document.getElementById('todo_details_incall')
                    if (name.value) {
                        let idea = {
                            name: name.value,
                            detail: detail.value,
                        }
                        let last_data = localStorage.getItem('user_ideas')
                        let new_data = last_data ? last_data + 'po/d' + JSON.stringify(idea) : JSON.stringify(idea)
                        localStorage.setItem('user_ideas', new_data)
                        detail.value = ''
                        name.value = ''
                        conn.send({
                            title: 'added_new_idea',
                            idea
                        })
                    }
                })
                document.getElementById('call_txt_note').addEventListener('change',(e) => {
                    conn.send({
                        title: 'update_notes_incall',
                        data: e.target.value
                    })
                })
            })
        }else if (data.title === 'end_call') {
            alert('the user who you was calling to, did not accept the call')
            document.getElementById('island_card_4').style.display = 'none'
            document.getElementById('msgs_ctx').style.display = 'block'
            document.getElementById('call_ctx').style.display = 'none'
        }
    })
})

socket.on('new_video_call', ({key, username}) => {
    let user = JSON.parse(localStorage.getItem('user'))
    let conn = peer.connect(key)
    conn.on('open', () => {
        conn.send({
            title: 'new_call',
            caller: user.username,
            start: Date(),
            type: 'video_call'
        })
    })
    document.getElementById('island_card_4').style.display = 'flex'
    document.getElementById('wait_for_connection').style.display = 'block'
    document.getElementById('call_connection_request').style.display = 'none'
    conn.on('data', data => {
        if (data.title === 'call_accepted') {
            document.getElementById('someone_name_place').innerHTML = username
            document.getElementById('msgs_ctx').style.display = 'none'
            document.getElementById('call_ctx').style.display = 'block'
            document.getElementById('island_card_4').style.display = 'none'
            navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
            }).then(stream => {
                console.log('calling : ' + key)
                let v =document.getElementById('my_video_place')
                v.srcObject = stream
                v.muted = true
                let call = peer.call(key, stream)
                call.on('stream', user_viveo_stream => {
                    let remote_v = document.getElementById('someone_video_place')
                    remote_v.srcObject = user_viveo_stream
                })
                conn.on('data', data => {
                    if (data.title === 'end_call_in_call') {
                        document.getElementById('island_card_4').style.display = 'none'
                        document.getElementById('msgs_ctx').style.display = 'block'
                        document.getElementById('call_ctx').style.display = 'none'
                        stream.getTracks().forEach(function(track) { track.stop(); })
                    }else if (data.title === 'update_notes_incall') {
                        document.getElementById('call_txt_note').value = data.data
                    }
                })
                document.getElementById('end_call_in_call_btn').addEventListener('click' ,() => {
                    conn.send({
                        title: 'end_call_in_call'
                    })
                    document.getElementById('island_card_4').style.display = 'none'
                    document.getElementById('msgs_ctx').style.display = 'block'
                    document.getElementById('call_ctx').style.display = 'none'
                    stream.getTracks().forEach(function(track) { track.stop(); })
                    conn.close()
                    reject_call_ui()
                })
                document.getElementById('add_a_new_idea_incall').addEventListener('click', () => {
                    let name = document.getElementById('idea_name_incall')
                    let detail = document.getElementById('todo_details_incall')
                    if (name.value) {
                        let idea = {
                            name: name.value,
                            detail: detail.value,
                        }
                        let last_data = localStorage.getItem('user_ideas')
                        let new_data = last_data ? last_data + 'po/d' + JSON.stringify(idea) : JSON.stringify(idea)
                        localStorage.setItem('user_ideas', new_data)
                        detail.value = ''
                        name.value = ''
                        conn.send({
                            title: 'added_new_idea',
                            idea
                        })
                    }
                })
                document.getElementById('call_txt_note').addEventListener('change',(e) => {
                    conn.send({
                        title: 'update_notes_incall',
                        data: e.target.value
                    })
                })
            })
        } else if (data.title === 'end_call') {
            alert('the user who you was calling to, did not accept the call')
            document.getElementById('island_card_4').style.display = 'none'
            document.getElementById('msgs_ctx').style.display = 'block'
            document.getElementById('call_ctx').style.display = 'none'
        }
    })
})

const reject_call_ui = () => {
    document.getElementById('island_card_4').style.display = 'none'
    document.getElementById('msgs_ctx').style.display = 'block'
    document.getElementById('call_ctx').style.display = 'none'
}

peer.on('connection', conn => {
    conn.on('data', data => {
        if (data.title === 'new_call' && data.type === 'audio_call') {
            document.getElementById('island_card_4').style.display = 'flex'
            document.getElementById('wait_for_connection').style.display = 'none'
            document.getElementById('call_connection_request').style.display = 'block'
            document.getElementById('caller_data').innerHTML = `${data.caller} is calling you in audio 📞`
            document.getElementById('answer_call').addEventListener('click', () => {
                conn.send({
                    title: 'call_accepted'
                })
                document.getElementById('someone_name_place').innerHTML = data.caller
                document.getElementById('wait_for_connection').style.display = 'block'
                document.getElementById('call_connection_request').style.display = 'none'
                peer.on('call', _call => {
                    document.getElementById('msgs_ctx').style.display = 'none'
                    document.getElementById('island_card_4').style.display = 'none'
                    document.getElementById('call_ctx').style.display = 'block'
                    navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: false,
                    }).then((stream) => {
                        document.getElementById('end_call_in_call_btn').addEventListener('click' ,() => {
                            conn.send({
                                title: 'end_call_in_call'
                            })
                            document.getElementById('island_card_4').style.display = 'none'
                            document.getElementById('msgs_ctx').style.display = 'block'
                            document.getElementById('call_ctx').style.display = 'none'
                            stream.getTracks().forEach(function(track) { track.stop(); })
                            conn.close()
                            reject_call_ui()
                        })
                        document.getElementById('call_txt_note').addEventListener('change',(e) => {
                            conn.send({
                                title: 'update_notes_incall',
                                data: e.target.value
                            })
                        })
                        document.getElementById('add_a_new_idea_incall').addEventListener('click', () => {
                            let name = document.getElementById('idea_name_incall')
                            let detail = document.getElementById('todo_details_incall')
                            if (name.value) {
                                let idea = {
                                    name: name.value,
                                    detail: detail.value,
                                }
                                let last_data = localStorage.getItem('user_ideas')
                                let new_data = last_data ? last_data + 'po/d' + JSON.stringify(idea) : JSON.stringify(idea)
                                localStorage.setItem('user_ideas', new_data)
                                detail.value = ''
                                name.value = ''
                                conn.send({
                                    title: 'added_new_idea',
                                    idea
                                })
                            }
                        })
                        conn.on('data', data => {
                            if (data.title === 'end_call_in_call') {
                                document.getElementById('island_card_4').style.display = 'none'
                                document.getElementById('msgs_ctx').style.display = 'block'
                                document.getElementById('call_ctx').style.display = 'none'
                                stream.getTracks().forEach(function(track) { track.stop(); })
                            } else if (data.title === 'update_notes_incall') {
                                document.getElementById('call_txt_note').value = data.data
                            }
                        })
                        _call.answer(stream)
                        let v =document.getElementById('my_video_place')
                        v.srcObject = stream
                        v.muted = true
                        _call.on('stream', user_viveo_stream => {
                            let remote_v = document.getElementById('someone_video_place')
                            remote_v.srcObject = user_viveo_stream
                        })
                    })
                })
            }) 
            document.getElementById('reject_call').addEventListener('click' ,() => {
                conn.send({
                    title: 'end_call'
                })
                conn.close()
                reject_call_ui()
            })
            
        } else if (data.title === 'new_call' && data.type === 'video_call') {
            document.getElementById('island_card_4').style.display = 'flex'
            document.getElementById('wait_for_connection').style.display = 'none'
            document.getElementById('call_connection_request').style.display = 'block'
            document.getElementById('caller_data').innerHTML = `${data.caller} is calling you in video 🎥`
            document.getElementById('answer_call').addEventListener('click', () => {
                conn.send({
                    title: 'call_accepted'
                })
                document.getElementById('someone_name_place').innerHTML = data.caller
                document.getElementById('wait_for_connection').style.display = 'block'
                document.getElementById('call_connection_request').style.display = 'none'
                peer.on('call', _call => {
                    document.getElementById('msgs_ctx').style.display = 'none'
                    document.getElementById('island_card_4').style.display = 'none'
                    document.getElementById('call_ctx').style.display = 'block'
                    navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: true,
                    }).then((stream) => {
                        conn.on('data', data => {
                            if (data.title === 'end_call_in_call') {
                                document.getElementById('island_card_4').style.display = 'none'
                                document.getElementById('msgs_ctx').style.display = 'block'
                                document.getElementById('call_ctx').style.display = 'none'
                                stream.getTracks().forEach(function(track) { track.stop(); })
                            }else if (data.title === 'update_notes_incall') {
                                document.getElementById('call_txt_note').value = data.data
                            }
                        })
                        document.getElementById('end_call_in_call_btn').addEventListener('click' ,() => {
                            conn.send({
                                title: 'end_call_in_call'
                            })
                            document.getElementById('island_card_4').style.display = 'none'
                            document.getElementById('msgs_ctx').style.display = 'block'
                            document.getElementById('call_ctx').style.display = 'none'
                            stream.getTracks().forEach(function(track) { track.stop(); })
                            conn.close()
                            reject_call_ui()
                        })
                        document.getElementById('call_txt_note').addEventListener('change',(e) => {
                            conn.send({
                                title: 'update_notes_incall',
                                data: e.target.value
                            })
                        })
                        document.getElementById('add_a_new_idea_incall').addEventListener('click', () => {
                            let name = document.getElementById('idea_name_incall')
                            let detail = document.getElementById('todo_details_incall')
                            if (name.value) {
                                let idea = {
                                    name: name.value,
                                    detail: detail.value,
                                }
                                let last_data = localStorage.getItem('user_ideas')
                                let new_data = last_data ? last_data + 'po/d' + JSON.stringify(idea) : JSON.stringify(idea)
                                localStorage.setItem('user_ideas', new_data)
                                detail.value = ''
                                name.value = ''
                            }
                        })
                        _call.answer(stream)
                        let v =document.getElementById('my_video_place')
                        v.srcObject = stream
                        v.muted = true
                        _call.on('stream', user_viveo_stream => {
                            let remote_v = document.getElementById('someone_video_place')
                            remote_v.srcObject = user_viveo_stream
                        })
                    })
                })
            }) 
            document.getElementById('reject_call').addEventListener('click' ,() => {
                conn.send({
                    title: 'end_call'
                })
                conn.close()
                reject_call_ui()
            })
        }
    })
})