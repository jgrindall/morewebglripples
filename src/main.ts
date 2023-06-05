import * as THREE from "three"
import "./style.css"
import { Ripples } from "./ripples/ripples"
import { Ripples2 } from "./ripples/ripples2"
import { Ripples3 } from "./ripples/ripples3"
import { Ripples4 } from "./ripples/ripples4"
import init from "./ripples/ripples6"
import {Sand} from "./ripples/sand"
import {Sand2} from "./ripples/sand2"
import {Sand3} from "./ripples/sand3"
import {Points} from "./ripples/points"

console.log(THREE.REVISION)

function addRipples(){
    //const r = new Ripples()
    const c = document.createElement("canvas")
    document.body.appendChild(c)
    c.width = 800
    c.height = 400

    document.getElementById("update").addEventListener("click", ()=>{

        const img = new Image()
        img.onload = ()=>{
            const bgImg = new Image()
            bgImg.onload = ()=>{
                c.getContext("2d").clearRect(0, 0, 800, 400)
                c.getContext("2d").drawImage(bgImg, 0, 0, 800, 400)
                for(let i  = 0; i < Math.floor(Math.random() * 10) + 4; i++){
                    const x = 20 + Math.random()* 600
                    const y = 20 + Math.random()* 250
                    c.getContext("2d").drawImage(img, x, y, 150, 150)
                }
                //r.update(c);
            }
            bgImg.src = "./tiling-mosaic.png";
        }
        img.src = "./truck.png"
    })
}

//new Ripples()
new Points()
//new Sand()
//new Sand2()
//new Points()