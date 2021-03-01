(() => {

    const properties = {
        spaceDiameter  : 32,    //диаметр пространства точки
        dotDiameter    : 14,    //диаметр самой точки
        wavelength     : 100,   //длинна волны
        velocity       : .03,   //скорость по умолчанию .02-.03
        direction      : 1,     //направление (1: из центра, -1: в центр)
        displacement   : 0      //смещение (0: отключить, 1: включить)
    }

    const canvas = document.createElement('canvas');        //создаём Canvas
    const ctx = canvas.getContext('2d');                    //получаем контекст

    let w = canvas.width = innerWidth;                      //ширина равна ширине области просмотра
    let h = canvas.height = innerHeight;                    //высота равна высоте области просмотра

    let dotsList;                                           //переменная для хранения списка точек

    canvas.style.background = 'rgba(17, 17, 23 ,1)';        //цвет canvas
    document.querySelector('body').appendChild(canvas);     //добавляем canvas в body

    window.onresize = function() {                          //обновляем размеры Canvas если меняется размер окна
        w = canvas.width = innerWidth;
        h = canvas.height = innerHeight;
        init();
    }

    class Dot {                                             //конструктор точки
        constructor(x, y, num) {
            this.x = x;
            this.y = y;
            this.radius = properties.dotDiameter / 2;
            this.scale = getDistance(x, y) / properties.wavelength;
            this.text = num;
        }

        update() {
            this.resize();
            this.draw();
        }

        resize() {
            this.scale = this.scale - properties.velocity * properties.direction;
        }

        draw() {

            let s = ( 1 - Math.abs(Math.sin(this.scale)));
            let o = (1 - s) * 255;
            let r = this.radius * s;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, 2 * Math.PI, false);
            ctx.closePath();
            ctx.fillStyle = 'rgba( 255,'+ o +', '+ o +', '+ s +')';
            ctx.fill();
            // ctx.fillText(this.text, this.x, this.y);
        }
    }

    init();
    function init() {
        dotsList = [];

        const dotsCountX = w / properties.spaceDiameter | 0; //Math.floor(w / properties.spaceDiameter);
        const dotsCountY = h / properties.spaceDiameter | 0;
        const startX = (properties.spaceDiameter + w - dotsCountX * properties.spaceDiameter) / 2;
        const startY = (properties.spaceDiameter + h - dotsCountY * properties.spaceDiameter) / 2;

        let displacement = properties.spaceDiameter / 4 * properties.displacement;

        for ( let j = 0; j < dotsCountY; j++) {
            displacement = - displacement;
            let y = startY + j * properties.spaceDiameter;
            for (let i = 0; i < dotsCountX; i++) {
                let x = startX + i * properties.spaceDiameter + displacement;
                dotsList.push(new Dot(x, y, j + i));
            }
        }
    }

    loop();
    function loop() {
        ctx.clearRect(0, 0, w, h);

        for (let a in dotsList) {
            dotsList[a].update();
        }

        requestAnimationFrame(loop);            //зацикливаем loop();
    }

    function getDistance(x, y) {                    //      получаем расстояние от центра области просмотра до точки ...
        let dx = w / 2 - x;                         //  ... используя теорему Пифагора
        let dy = h / 2 - y;                         
        return Math.sqrt((dx * dx) + (dy * dy));    
    }

})();