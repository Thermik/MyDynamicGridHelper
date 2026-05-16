import * as THREE from 'three';
import {Text, preloadFont} from 'troika-three-text'


class MyDynamicGridHelper {
    constructor(w = 1000, h = 1000, step = 20, axis_color = 0xCCCCCC, grid_color = 0x444444, grid_color10 = 0xFF0000) {

        axis_color = new THREE.Color(axis_color);
        grid_color = new THREE.Color(grid_color);
        grid_color10 = new THREE.Color(grid_color10);

        this.isInitialized = false;

        this.w = w; // Общий размер "зоны", которую может покрыть сетка
        this.h = h;
        this.step = step; // Базовый шаг сетки
        this.axis_color = axis_color;
        this.grid_color = grid_color;

        this.camera = null; // Ссылка на камеру
        this.controls = null; // Ссылка на контролы
        this.texts = []
    }

    // Метод для установки камеры и контролов
    setCameraAndControls(camera, controls, renderer, group) {
        this.camera = camera;
        this.controls = controls;
        this.group = group;
        this.renderer = renderer;
        this.isInitialized = true; // Теперь можно обновлять
        this.update(); // Первичный рендер сетки
    }


    setEventListener(event, handleChange) {

        if (event === 'end') this.controls.addEventListener(event, handleChange)
        if (event === 'change') this.controls.addEventListener(event, handleChange)

    }


    infoUpdate(x, y, zoom) {
        if (!this.isInitialized) return
        document.getElementById('coord-valueX').textContent = `${x.toFixed(3)}`
        document.getElementById('coord-valueY').textContent = `${y.toFixed(3)}`
        document.getElementById('coord-valueZoom').textContent = `${(this.camera.zoom).toFixed(6)}`

        const rect = this.renderer.domElement.getBoundingClientRect();

        this.pH.position.set(x,(rect.height / 2 - 22)/this.camera.zoom,6)
        this.pV.position.set(-(rect.width /2 - 22)/this.camera.zoom,y,6)



    }

    // Метод для перерисовки сетки
    update() {
        if (!this.isInitialized || !this.camera || !this.controls) {
            return;
        }

        removefromGroup(this.group, 'GridHelper')

        this.texts = []

        let centerX = this.controls.target.x// this.camera.zoom;
        let centerY = this.controls.target.y//this.camera.zoom;

        let windowL = this.camera.left / this.camera.zoom + centerX;
        let windowR = this.camera.right / this.camera.zoom + centerX;
        let windowT = this.camera.top / this.camera.zoom + centerY;
        let windowB = this.camera.bottom / this.camera.zoom + centerY;


        let step = calculateGridStep(this.camera.zoom, this.step)

        function calculateGridStep(zoom, step = 100) {
            const baseGridStep = step;

            let gridStep;
            let exponent = 100

            if (zoom < 1.0) {
                let multiplications = 0;
                let currentZoomThreshold = 0.5;

                if (zoom < 1.0) {
                    while (zoom < currentZoomThreshold && currentZoomThreshold) {
                        multiplications++;
                        currentZoomThreshold /= 2;
                    }
                }

                gridStep = baseGridStep * Math.pow(2, multiplications);
            } else if (zoom < 8.0) {
                exponent = Math.floor(Math.log2(zoom));
                gridStep = baseGridStep / Math.pow(2, exponent);
            } else if (zoom >= 8.0 && zoom < 10.0) {
                exponent = Math.floor(Math.log2(4));
                gridStep = baseGridStep / Math.pow(2, exponent);
            } else if (zoom >= 10.0 && zoom < 20.0) {
                exponent = Math.floor(Math.log10(10));
                gridStep = baseGridStep / Math.pow(10, exponent);
            } else if (zoom >= 20.0 && zoom < 50.0) {
                exponent = Math.floor(Math.log10(20));
                gridStep = baseGridStep / Math.pow(20, exponent);
            } else if (zoom >= 50.0 && zoom < 100.0) {
                exponent = Math.floor(Math.log10(50));
                gridStep = baseGridStep / Math.pow(50, exponent);
            } else if (zoom >= 100 && zoom < 200) {
                gridStep = 1
            } else if (zoom >= 200 && zoom < 500) {
                gridStep = 0.5
            } else if (zoom >= 500 && zoom < 1000) {
                gridStep = 0.2
            } else if (zoom >= 1000) {
                gridStep = 0.1
            }

//            console.log(`zoom:${zoom} exponent${exponent} gridStep:${gridStep}`)
            return gridStep;
        }

        let vertices = [];
        let colors = [];
        let colorIndex = 0;

        let numStepsYToTop = Math.ceil(windowT / step);
        let numStepsYToBottom = Math.floor(windowB / step);
        let numStepsXToLeft = Math.floor(windowL / step);
        let numStepsXToRight = Math.ceil(windowR / step);

        //console.log(`res:${result} L${windowL} R${windowR} LS${numStepsYToTop} LR${numStepsXToRight}`)

        let il = (numStepsXToLeft - 1) * step
        let ir = (numStepsXToRight + 1) * step

        function text(text, size, x, y, z) {
            let itext = new Text()
            itext.font = './font/Gilroy-Regular.ttf'

            itext.fontSize = size
            itext.color = 0xFFFFFF
            itext.visible = true
            itext.textAlign = 'left'
            itext.name = 'GridHelper'
            itext.sdfGlyphSize = 128;
            itext.textureFilter = 'linear'

            itext.text = text
            itext.position.x = x
            itext.position.y = y
            itext.position.z = z
            itext.renderOrder = 0
            itext.sync()

            return itext
        }

        il = windowL + 20 / this.camera.zoom

        let vertices10 = []
        let colors10 = [];
        let colorIndex10 = 0;

        // Рисуем горизонтальные линии
        for (let i = numStepsYToTop; i >= numStepsYToBottom; i--) {

            let istep = i * step

            //console.log(il,ir)
            vertices.push(il, istep, 0, ir, istep, 0);
            const color = i === 0 ? this.axis_color : this.grid_color
            color.toArray(colors, colorIndex);
            colorIndex += 3;
            color.toArray(colors, colorIndex);
            colorIndex += 3;
            let itext = text(trimNumberToString(istep), 10 / this.camera.zoom, windowL + 4 / this.camera.zoom, istep, 4)
            itext.rotation.z = THREE.MathUtils.degToRad(90)
            this.texts.push(itext)
            this.group.add(itext)


            for (let j = 0; j < 10; j++) {
                let d = (j % 5 === 0) ? 0 : 4
                let iistep = istep + (step / 10) * j
                vertices10.push(
                    windowL + (13 + d) / this.camera.zoom, iistep, 4,
                    windowL + 22 / this.camera.zoom, iistep, 4);
                this.grid_color.toArray(colors10, colorIndex10);
                colorIndex10 += 3;
                this.grid_color.toArray(colors10, colorIndex10);
                colorIndex10 += 3;
            }

        }


        for (let i = numStepsXToRight; i >= numStepsXToLeft; i--) {

            let istep = i * step

            vertices.push(istep, numStepsYToTop * step, 0, istep, numStepsYToBottom * step, 0);
            const color = i === 0 ? this.axis_color : this.grid_color
            color.toArray(colors, colorIndex);
            colorIndex += 3;
            color.toArray(colors, colorIndex);
            colorIndex += 3;
            let itext = text(trimNumberToString(istep), 10 / this.camera.zoom, istep + 2 / this.camera.zoom, windowT - 4 / this.camera.zoom, 4)
            this.texts.push(itext)
            this.group.add(itext)

            for (let j = 0; j < 10; j++) {
                let d = (j % 5 === 0) ? 0 : 4
                let iistep = istep + (step / 10) * j
                vertices10.push(
                    iistep, windowT - (13 + d) / this.camera.zoom, 4,
                    iistep, windowT - 22 / this.camera.zoom, 4);
                this.grid_color.toArray(colors10, colorIndex10);
                colorIndex10 += 3;
                this.grid_color.toArray(colors10, colorIndex10);
                colorIndex10 += 3;
            }
        }

        this.geometry10 = new THREE.BufferGeometry();
        this.geometry10.setAttribute('position', new THREE.Float32BufferAttribute(vertices10, 3));
        this.geometry10.setAttribute('color', new THREE.Float32BufferAttribute(colors10, 3));
        this.material10 = new THREE.LineBasicMaterial({vertexColors: true});
        this.LineSegments10 = new THREE.LineSegments(this.geometry10, this.material10)
        this.LineSegments10.name = 'GridHelper'
        this.LineSegments10.renderOrder = 1
        this.group.add(this.LineSegments10)


        // Обновляем геометрию
        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        //this.LineSegments.geometry.attributes.position.needsUpdate = true;
        //this.LineSegments.geometry.attributes.color.needsUpdate = true;

        this.material = new THREE.LineBasicMaterial({vertexColors: true});
        this.LineSegments = new THREE.LineSegments(this.geometry, this.material)
        this.LineSegments.name = 'GridHelper'
        this.LineSegments.renderOrder = 1
        this.group.add(this.LineSegments)

        const spriteV = new THREE.Sprite(new THREE.SpriteMaterial({color: '#202228'}));
        spriteV.position.set(windowL + 11 / this.camera.zoom, centerY, 3);
        spriteV.scale.set(22 / this.camera.zoom, (this.camera.top - this.camera.bottom) / this.camera.zoom, 1);
        spriteV.name = 'GridHelper'
        spriteV.renderOrder = 1
        this.group.add(spriteV)

        const spriteH = new THREE.Sprite(new THREE.SpriteMaterial({color: '#202228'}));
        spriteH.position.set(centerX, windowT - 11 / this.camera.zoom, 3);
        spriteH.scale.set((this.camera.right - this.camera.left) / this.camera.zoom, 22 / this.camera.zoom, 1);
        spriteH.name = 'GridHelper'
        spriteH.renderOrder = 1
        this.group.add(spriteH)

        const spriteC = new THREE.Sprite(new THREE.SpriteMaterial({color: '#202228'}));
        spriteC.position.set(windowL + 11 / this.camera.zoom, windowT - 11 / this.camera.zoom, 5);
        spriteC.scale.set(22 / this.camera.zoom, 22 / this.camera.zoom, 1);
        spriteC.name = 'GridHelper'
        spriteC.renderOrder = 1
        this.group.add(spriteC)

        this.pH = triangle(this.camera.zoom, 'V')
        this.pH.position.set(0, windowT - 22 / this.camera.zoom, 6)
        this.group.add(this.pH)


        this.pV = triangle(this.camera.zoom, 'H')
        this.pV.position.set(windowL + 22 / this.camera.zoom, 0, 6)
        this.group.add(this.pV)


    }
}

function triangle(zoom, dir = 'V'  ) {

    const geometry = new THREE.BufferGeometry()
    const verticesV = [
        0.0, 0.0, 5.0, // v0
        0.55 * 8 / zoom, 8 / zoom, 0.0, // v1
        -0.55 * 8 / zoom, 8 / zoom, 0.0, // v1
        0.0, 0.0, 0.0 // v4
    ];

    const verticesH = [
        0.0, 0.0, 5.0, // v0
        -8 / zoom,  0.55 * 8 / zoom,  0.0, // v1
        -8 / zoom,   -0.55 * 8 / zoom, 0.0, // v1
        0.0, 0.0, 0.0 // v4
    ];



    let vertices = dir === 'V'? verticesV: verticesH

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.MeshBasicMaterial({color: 0x7d0db5});
    let m = new THREE.Mesh(geometry, material)


    m.name = 'GridHelper'
    return m
}


function removefromGroup(group, item) {
    function remove(child_name) {
        for (let i = group.children.length - 1; i >= 0; i--) {
            if (group.children[i].name.slice(0, child_name.length) === child_name) group.remove(group.children[i]);
        }
    }

    remove(item)
}


function trimNumberToString(num) {
    // Переводим число в строку для точного разделения
    const numStr = num.toString();
    const [integerPart, fractionPart] = numStr.split('.');

    if (fractionPart) {
        const firstDecimal = fractionPart ? fractionPart[0] : '0';
        return `${integerPart}.${firstDecimal}`;

    } else {
        return `${integerPart}`
    }
}


export {MyDynamicGridHelper}
