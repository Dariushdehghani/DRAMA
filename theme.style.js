const colors = [
    '#ff8080',
    '#80ff80',
    '#8080ff',
    '#ff00dd',
    '#9d00ff',
    '#00fffb',
    '#c3ff00',
    '#ffa200',
    '#009dff',
    '#600000'
]

// these lines are pasted from dra project in react
function change_theme(selected_color) {
    let props = {
        themeColor : selected_color
    }
    const set_theme_color = (color) => {
        let themeColor = {
            original : color,
            secondColor : color + '55',
            background : color + '22',
            thirdColor : color + '77'
        }
        root.style.setProperty('--primary-color', themeColor.original)
        root.style.setProperty('--bg-primary-color', themeColor.background)
        root.style.setProperty('--second-color', themeColor.secondColor)
        root.style.setProperty('--third-color', themeColor.thirdColor)
    }
    let root = document.querySelector(':root');
    if(props.themeColor) {
        if (props.themeColor.length === 7) {
            set_theme_color(props.themeColor)
        } else if (props.themeColor.length === 4) {
            let color_arr = []
            for(let letter of props.themeColor) {
                color_arr.push(letter)
            }
            color_arr[0] = ''
            let correctColor = ''
            for (let i of color_arr) {
                correctColor += i+i
            }
            set_theme_color('#' + correctColor)
        }
    } 
}