window.addEventListener('load', () => {
    const canvas = document.querySelector('.canvas');

    const engine = createEngine(canvas);

    window.addEventListener('beforeunload', function (e) {
        localStorage.setItem('objectPojos', engine.getSerializedObjects());
    });
    window.spawnRock = spawnRock;

    const objects = localStorage.getItem('objectPojos');
    let rock = null;
    if (objects) {
        const pojos = engine.deserializeObjects([objects]);
        console.log('wow!', pojos[0]); 
        rock = window['spawnRock'](engine, pojos[0]);
    } else {
        rock = spawnRock(engine); // Todo: unhappy with this injection
    }

    engine.addObject(rock);
    window.rock = rock;

    engine.start();
});

const spawnRock = (engine, pojo) => {
    let color = pojo && pojo.color || 'red';
    let x = pojo && pojo.x || 0;
    let y = pojo && pojo.y || 0;
    let width = 50;
    let height = 50;
    let spawnFunctionName = 'spawnRock';
    let customFunction = () => { console.log('I am a custom function and I do deserve some respect!');}

    return {
        setColor(c) {
            color = c; 
        },
        getColor() {
            return color;
        },
        moveRight() {
            x += 10;
        },
        moveLeft() {
            x -= 10;
        },
        moveTop() {
            y -= 10;
        },
        moveDown() {
            y += 10;
        },
        setCustomFunction(f) {
            customFunction = f; 
        },
        logic() {
            customFunction(); 
        },
        render() {
            engine.drawRect({fillColor: color, x, y, width, height});
        },
        toPojo() {
            return {
                x, y, width, height, color, customFunction, spawnFunctionName
            }
        }
    }
}

const createEngine = (canvas) => {
    const ctx = canvas.getContext('2d');
    const objects = [];

    const renderLoop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        objects.forEach(obj => {
            obj.render();
        });
        window.requestAnimationFrame(renderLoop);
    }

    const gameLoop = () => {
        objects.forEach(obj => {
            obj.logic(); 
        });
    }

    setInterval(gameLoop, 1000);

    return {
        addObject(object) {
            objects.push(object);    
        },
        start() {
            renderLoop();
        },
        drawRect({ fillColor, x, y, width, height }) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(x, y, width, height);
        },
        getSerializedObjects() {
            const replacer = (key, value) => {
                if (typeof value === 'function') {
                    return value.toString();
                }
                return value;
            }
            return objects.reduce((str, obj) => {
                return JSON.stringify(obj.toPojo(), replacer, 2);     
            }, '');
        },
        deserializeObjects(serializedObjects) {
            const reviver = (key, value) => {
                if (typeof value === 'string' 
                    && value.indexOf('() =>') === 0
                ) {
                    let functionTemplate = `(${value})`;       
                    return eval(functionTemplate);
                }
                return value;
            }

            return serializedObjects.map((obj) => JSON.parse(obj, reviver));
        }
    }
}

