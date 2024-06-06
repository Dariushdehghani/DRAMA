var isFileUploaded = 0
var step = 0;
switch1 = false

peer.on('open', id => {
    let user = JSON.parse(localStorage.getItem('user'))
    socket.emit('add_peer_id', {id, user})
    user.key2 = id
    user.key1 = socket.id
    let new_data = JSON.stringify(user)
    localStorage.setItem('user', new_data)
    
    // set the share centre card content'
    document.getElementById('key_1_place').innerHTML = socket.id
    document.getElementById('key_2_place').innerHTML = id
    document.getElementById('key_3_place').innerHTML = user.key3
})

peer.on('connection', conn => {
    conn.on('data', data => {
        if (data.title === 'new_call') {
            document.getElementById('user_calling_name_place').innerHTML = `${data.caller} is ${data.type === 'video_call'? 'videa' : 'audio'}calling you`
        }
    })
})

window.onload = () => {
    let data = localStorage.getItem('user');
    console.log('sending to analyse: ' + data)
    socket.emit('analyse_user_data', JSON.parse(data))
    // calander setup
    let date = new Date()
    let date2 = date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear()
    set_time()
    document.getElementById('calander_date').innerHTML = date2
    user_daily_update()

    // themrs setup
    if (localStorage.getItem('theme') === 'dark') {
        document.getElementById('body_elem').style.backgroundColor = 'black'
        document.getElementById('switch_theme_input').setAttribute('checked', '')
        switch1 = true
    } else {
        document.getElementById('body_elem').style.backgroundColor = 'white'
    }

    change_theme(localStorage.getItem('theme_color'))

    // ideas setup
    let ideas_ctx = document.getElementById('ideas_ctx_card')
    let ideas = localStorage.getItem('user_ideas')
    if (ideas) {
        let ideas_arr = ideas.split('po/d')
        for (let jsidea of ideas_arr) {
            console.log(jsidea)
            let idea = JSON.parse(jsidea)
            ideas_ctx.innerHTML += `<div ondblclick="idea_db_clicked(event)" ondragstart="event.dataTransfer.setData('text', '${idea.name}')" draggable="true" class="idea_card" >
            <h3 style="margin: 0;">${idea.name}</h3>
            </div>`
            console.log(idea)
        }
    }
}

function idea_db_clicked(ev) {
    ev.target.remove()
    let local = localStorage.getItem('user_ideas')
    let data_arr = local.split('po/d')
    let data_array = []
    for (let x in data_arr) {
        let data = JSON.parse(data_arr[x])
        if (data.name === ev.target.innerHTML) {
            continue
        }
        data_array.push(JSON.stringify(data))
    }
    // back datas into json
    let data_array_json = '';
    for (let i of data_array) {
        if (data_array[0] === i) {
            data_array_json = data_array[0]
        } else {
            data_array_json += 'po/d' + i
        }
    }
    localStorage.setItem('user_ideas', data_array_json)
}

function drop_idea(ev) {
    let data = ev.dataTransfer.getData('text')
    // search the title 
    let result;
    let saved_arr = localStorage.getItem('user_ideas').split('po/d')
    for (let JSidea of saved_arr) {
        let idea = JSON.parse(JSidea)
        if (idea.name === data) {
            result = idea
            break;
        }
    }
    if (result) {
        new_todo_file()
        document.getElementById('new_todo_title').value = result.name
        document.getElementById('new_todo_description').value = result.detail
    }
}

function change_theme_color(color) {
    change_theme(color)
    localStorage.setItem('theme_color', color)
}

function toggle_dark_theme() {
    if (switch1) {
        switch1 = false
        document.getElementById('body_elem').style.backgroundColor = 'white'
        localStorage.setItem('theme', 'light')
    } else {
        switch1 = true
        document.getElementById('body_elem').style.backgroundColor = 'black'
        localStorage.setItem('theme', 'dark')
    }
}

function set_time() {
    let timer_ctx = document.getElementById('time_now')
    setInterval(() => {
        let date = new Date()
        timer_ctx.innerHTML = date.getHours() + ':' + date.getMinutes() + ":" + date.getSeconds()
    }, 500)
}

socket.on('analyse_request_not_accepted', () => {
    alert('not accepted')
    window.location.pathname = '/signin'
    localStorage.clear()
})

socket.on('analyse_request_accepted', data2 => {
    let data = data2.username.toString()
    let n = data.slice(0,1).toUpperCase()
    let ame = data.slice(1,data.length).toLowerCase()
    document.getElementById('name_place').innerHTML = `Hello ${n + ame}👋`
})

function new_todo_file() {
    document.getElementById('island_card_1').style.display = 'flex'
}

function add_step_to_todoCreator_page() {
    step ++;
    let input = document.createElement('input');
    input.className = 'input_type_1'
    input.placeholder = 'step' + step;
    input.id = 'new_todo_step_' + step
    document.getElementById('steps_context').appendChild(input)
}

function addit_to_file() {
    let title = document.getElementById('new_todo_title').value
    let description = document.getElementById('new_todo_description').value
    let steps = [];
    if(step > 0) {
        for(let x = 1; x <= step; x++) {
            let s = document.getElementById('new_todo_step_' + x)
            steps[x-1] = s.value
            console.log(s.value)
        }
    }
    let last_data = localStorage.getItem('user_daily')
    let new_d = {
        issue: 'todo',
        done: 0,
        title,
        description,
        steps
    }
    let new_data_json = JSON.stringify(new_d)
    let new_data =last_data ? last_data + 'po/d' + new_data_json : new_data_json;
    localStorage.setItem('user_daily', new_data)
    close_add_todo_window()
    user_daily_update()
}

function show_file_card() {
    document.getElementById('root_1').style.display = 'none'
    document.getElementById('root_2').style.display = 'block'
}

function show_today_card() {
    document.getElementById('root_1').style.display = 'block'
    document.getElementById('root_2').style.display = 'none'
}

function download_userdaily_file() {
    if (confirm('do you really want to? if you do, your saved ativities will be on the file an will be deleted on the app.')) {
        const filename = new Date() + '.DRAMAFile.json'
        const data = localStorage.getItem('user_daily')
        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        if (confirm('is it downloaded?')) {
            localStorage.removeItem('user_daily')
            localStorage.removeItem('user_ideas')
            window.location.reload()
        } else {
            alert('we did not deleted your activity, try to download it again.')
        }
    }
}

function del_userdaily_file() {
    if (confirm('are you sure you want to delete the cache?')) {
        localStorage.removeItem('user_daily')
        localStorage.removeItem('user_ideas')
        window.location.reload()
    }
}

function last_file_loaded(elem) {
    if (confirm('if you do this, your last data will be deleted')) {
        let name_modified = elem.files[0].name.split('.')
        if (name_modified[name_modified.length -1] === 'json' && name_modified[name_modified.length -2] === 'DRAMAFile'){
            let reader = new FileReader()
            reader.onloadend = () => {
                localStorage.removeItem('user_daily')
                localStorage.setItem('user_daily', JSON.stringify(JSON.parse(reader.result)))
                window.location.reload()
            }
            reader.readAsText(elem.files[0])
        }
    }
}

function logout_user_account() {
    if (confirm('are you sure you want to log out? if you do, all of your data will be deleted')) {
        localStorage.clear()
        window.location.href = '/signin'
    }
}
    
function close_add_todo_window() {
    for(let x = 1; x <= step; x++) {
        let s = document.getElementById('new_todo_step_' + x)
        s.remove()
    }
    step = 0;
    document.querySelector('#new_todo_title').value = ''
    document.querySelector('#new_todo_description').value = ''
    document.getElementById('island_card_1').style.display = 'none'
}

function user_daily_update() {
    let data = localStorage.getItem('user_daily')
    if (data === null || data === undefined || data === '') {
        console.log('nothing to show')
    } else {
        let saved = data.split('po/d')
        document.querySelector('#e_no_todo').style.display = 'none'
        let contxt = document.getElementById('todos_show_ctx')
        contxt.innerHTML = ''
        for (let y of saved) {
            x = JSON.parse(y)
            if (x.issue = 'todo') {
                let container = document.createElement('div')
                container.className = x.done === 1 ? 'todo_card_2 transition_background' : 'todo_card_1 transition_background'
                container.innerHTML = x.done === 1 ? `
                <input ondblclick='undo_todo(${y})' type='checkbox' checked onclick='do_todo(${y})'>
                <div style='width: 100%' onclick='open_todo(${y})'><p>${x.title}</p></div>` : `
                <input type='checkbox' onclick='do_todo(${y})'>
                <div style='width: 100%' onclick='open_todo(${y})'><p>${x.title}</p></div>`
                contxt.appendChild(container)
            }
        }
    }
}  

// because of this scripts were used a lot, i changed them to a function, it changes the object that is saved in localStorage
/**
 * 
 * @param {*} item_key the key of local storage that you want to open
 * @param {*} split_key the word that you have set to seperate JSON OBJs
 * @param {*} verification_obj the obj you want to change
 * @param {*} change_wanted_key the work you wanna do with
 * @param {*} wanted_value the value you want to set
 */
function change_memorized_items(item_key, split_key, verification_obj, change_wanted_key, wanted_value) {
    let local = localStorage.getItem(item_key)
    let data_arr = local.split(split_key)
    let data_array = []
    for (let x in data_arr) {
        let data = JSON.parse(data_arr[x])
        if (data.title === verification_obj.title) {
            if (change_wanted_key === 'done') {
                data.done = wanted_value
            } else if (change_wanted_key === 'del') {
                continue
            }
        }
        data_array.push(JSON.stringify(data))
    }
    // back datas into json
    let data_array_json = '';
    for (let i of data_array) {
        if (data_array[0] === i) {
            data_array_json = data_array[0]
        } else {
            data_array_json += split_key + i
        }
    }
    localStorage.setItem(item_key, data_array_json)
}

function do_todo(todo) {
    change_memorized_items('user_daily', 'po/d', todo, 'done', 1)
    user_daily_update()
}

function undo_todo(todo) {
    change_memorized_items('user_daily', 'po/d', todo, 'done', 0)
    user_daily_update()
}

function open_todo(todo) {
    document.querySelector(':root').style.setProperty('--primery-color-dt', todo.done === 1 ? 'orange' : 'green')
    document.getElementById('todo_details_title').innerHTML = todo.title
    document.getElementById('todo_details_card').style.backgroundColor = todo.done === 1 ? 'var(--color-2)' : 'var(--color-4)'
    let checked = todo.done === 1 ? 'checked' : ''
    document.getElementById('checkbox_ctx_dt').innerHTML = `<input ${checked} onclick='event.preventDefault()' type="checkbox" >`
    document.getElementById('description_ctx_dt').innerHTML = todo.description
    // writing steps on the context 
    let steps_ctx = document.getElementById('steps_ctx_dt')
    steps_ctx.innerHTML = ''
    for (let step in todo.steps) {
        let step_con = document.createElement('div')
        step_con.id = `step_${step}_con_dt`
        step_con.className = 'steps_con_dt'
        step_con.innerHTML = `<p>${todo.steps[step]}</p>`
        steps_ctx.appendChild(step_con)
    }
    // show the todo details window
    document.getElementById('island_card_2').style.display = 'flex'
}

function close_todo_details_window() {
    document.querySelector('#island_card_2').style.display = 'none'
}

function add_button_clicked() {
    document.getElementById('add_todo_fab').style.display = 'block'
    document.getElementById('add_event_fab').style.display = 'block'
    window.onclick = target => {
        if (!(target.target.id === 'add_todo_fab' || target.target.id === 'add_event_fab' || target.target.id === 'big_fab_btn') && document.getElementById('add_todo_fab').style.display === 'block' && document.getElementById('add_event_fab').style.display === 'block') {
            document.getElementById('add_todo_fab').style.display = 'none'
            document.getElementById('add_event_fab').style.display = 'none'
        } 
    }
}