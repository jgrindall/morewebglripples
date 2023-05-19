"use strict";

var activeMax = 2280;  // this is the number of sand grains that are processed at
                   // at time. Increase for better looking effect. decrease
                   // if the machine is not keeping up with the load

var cw;
var ch;
var w;  //  
var h;

export var canvasBuf = document.createElement("canvas");

var ctxB
var globalTime;  // global to this 
var pixels
var sand;
var sandToFall;
var sandToFallCount = 36000;
var shadow; // shadow pixels
var activeMax = 2280;
var active; // index of pixel for active grain
var sandStatus; // status of active grain
var shadowChange; // holds index of pixels that have a shadow change
var pixels;
var buf;
var grain = 0xFFFFFFFF;
var shadowGrain = 0x00000000;
var ready = false;
var sandReady = 0;
var nextActive = 0;
var nextActiveShadow = 0;

var onResize = function(){
cw = canvas.width;
ch = canvas.height;
w = cw;  //  
h = ch;
pixels = w*h;
canvasBuf.width = w;
canvasBuf.height = h;
ctxB = canvasBuf.getContext("2d");
sand = new Uint8ClampedArray(pixels);
shadow = new Uint8ClampedArray(pixels); // shadow pixels
sandToFall = new Uint32Array(sandToFallCount);
activeMax = 2280;
active = new Uint32Array(activeMax); // index of pixel for active grain
sandStatus = new Uint16Array(activeMax); // status of active grain
shadowChange= new Uint32Array(activeMax); // holds index of pixels that have a shadow change
sandStatus.fill(0); // clear
active.fill(0);
shadowChange.fill(0);
ctxB.clearRect(0,0,w,h);
ctxB.fillStyle = "white";
ctxB.font = "84px arial";
ctxB.textAlign = "center";
ctxB.globalAlpha = 0.01;
for(var i = 0; i < 12; i ++){
    ctxB.fillText("Sand Doodler!",w/2 + (Math.random()-0.5)*5,h/2 + (Math.random()-0.5)*5);
}
ctxB.globalAlpha = 1;
pixels = ctxB.getImageData(0,0,w,h);
buf = new Uint32Array(pixels.data.buffer);   
for(i = 0; i < buf.length; i += 3){
    if(buf[i] !== 0){
        var c = buf[i] >>> 24;
        buf[i] = 0;
        while(c > 0){
            var ind = Math.floor(Math.random()*sandToFallCount);
            if(sandToFall[ind] === 0){
                sandToFall[ind] = i;
            }
            c = c >>> 1;
        }
    }
}
buf.fill(0);
offsets = [1,w-1,w,w+1,-w-1,-w,-w+1,-1];
shadowOffsets = [-w-1,-w,-1];
ready = true;
sandReady=0;
}
function sprinkle(x,y){
var ind;
if(y === undefined){
    ind = x;
}else{
    ind = x + y*w;
}
var alreadyExists = active.indexOf(ind);
var ac = nextActive;
if(alreadyExists > -1){
    sand[ind] += 1;
    shadow[ind] = 0; 
    sandStatus[alreadyExists] = 66;
}else{
    active[nextActive] = ind;
    sandStatus[nextActive] = 66;
    shadowChange[nextActiveShadow];
    nextActiveShadow = (nextActiveShadow+1)%activeMax;
    nextActive = (nextActive +1)%activeMax;
    sand[ind] += 1;
    shadow[ind] = 0;
}
return ac;
}

var offsets = [1,w-1,w,w+1,-w-1,-w,-w+1,-1];
var offsetCount = 8;
function update(){
var min,max,minDir,maxDir,dir,start,jj,j,ind,level,i,l1;
for( i = 0; i <activeMax; i ++){
    if(sandStatus[i] !== 0){
        ind = active[i];
        level = sand[ind];
        if(level === 1){
            sandStatus[i] = 1; // deactive is cant move (level ground)
        }else{
            min = level;
            var d;
            minDir = offsets[Math.floor(Math.random()*16)];
            dir = null;
            start = Math.floor(Math.random()*16); // start at a random direction
            for(j=0;j < offsetCount; j++){
                jj = offsets[(j + start)%offsetCount];
                l1 = sand[ind+jj];
                if(l1 < min){
                    min = l1;
                    minDir = jj;
                    d = (j + start)%offsetCount;
                }
            }
            dir = null;
            if(min >= level - 1){ // nowhere to move
                sandStatus[i] = 1;
                
            }else
            if(min < level-1){ // move to lowest
                dir = minDir
            }
            if(dir !== null){
                var lv = level-min;
                while(lv > 2){
                    active[i] = ind + dir;
                    if(sand[ind] > 1){
                        sand[ind] -= 2;
                        sprinkle(ind)
                    }else{
                        sand[ind] -=1;
                    }
                    ind = ind+dir;
                    sand[active[i]] += 1;
                    if(sand[active[i] + offsets[d]] >=level){
                        d+= Math.random()<0.5? 1 : offsetCount -1;
                        d %=offsetCount;
                    }
                    lv -= 1;
                }
                if(sand[ind]>0){
                    active[i] = ind + dir;
                    sand[ind] -= 1;
                }
                sand[active[i]] += 1;
            }
        }
    }
}   
}
var shadowOffsets = [-w-1,-w,-1];
var shadowCols = [0xFFf0f0f0,0xFFd0d0d0,0xFFb0b0b0,0xFF909090];
var shadowDist = [0xf0000000,0xd0000000,0xb0000000,0x90000000]; // shadow col no sand

// renders grains and adds shadows. Deactivates gains when they are done
function renderPix(){
var ac = 0;
for(var i = 0; i < activeMax; i ++){
    if(sandStatus[i] !== 0){
        ac += 1;
        var ind = active[i];
        buf[ind] = grain;
    }
}
for(var i = 0; i < activeMax; i ++){
    if(sandStatus[i] !== 0){
        var ind = active[i];
        var level = sand[ind];
        var col =0;
        if(sand[ind + shadowOffsets[0]] > level ){
            col = 2;
        }else
        if(sand[ind + shadowOffsets[1]] > level ){
            col =1;
        }else
        if(sand[ind + shadowOffsets[2]] > level ){
            col = 1;
        }
        buf[ind] = grain;  // add a sand grain to the image
        shadow[ind] = col;
        shadowChange[nextActiveShadow] = ind;
        nextActiveShadow = (nextActiveShadow + 1)%activeMax;

        var c = 4;
        while(c > 0){
            c-=1;
            ind += w + 1;
            var s = sand[ind];
            var dif = level - s;
            if(dif > 0){
                c-= dif;
            }
            shadow[ind] += 1;
            shadowChange[nextActiveShadow] = ind;
            nextActiveShadow = (nextActiveShadow + 1)%activeMax;
        }
        sandStatus[i] -= 1;
        if(sandStatus[i] === 1){
            sandStatus[i] = 0;
            active[i] = 0;                
        }
    }
}
// add calculated shadows
for(var i = 0; i < activeMax; i ++){
    if(shadowChange[i] !== 0){
        var ind = shadowChange[i];
        var s = shadow[ind] <4 ? shadow[ind]-1:3;
        if(sand[ind] > 0){
            buf[ind]=shadowCols[s];
        }else{
            buf[ind]=shadowDist[s];
        }
        shadowChange[i] = 0;
    }
}
   
}

// push sand about
function push(x,y,radius){
var iyy,iny
var rr = radius * radius ; 
x = Math.floor(x);
y = Math.floor(y);
for(var iy = -radius + 1; iy < radius; iy ++){
    iyy = iy * iy;
    iny = (y+iy) * w;
    for(var ix = -radius + 1; ix < radius; ix ++){
        if(ix*ix + iyy <= rr){ // is inside radius
            var ind = (x + ix) + iny; 
            if(sand[ind] > 0){
                var dir = Math.random() * Math.PI * 2;
                dir = Math.atan2(iy,ix)
                var r = radius + Math.random() * radius *0.2
                var xx = Math.cos(dir) * r;
                var yy = Math.sin(dir) * r;
                buf[ind] = 0x000000;
                sand[ind] = 0;
              
               ind = Math.floor(xx + x) + Math.floor(yy + y) * w;
               sprinkle(ind);
            }else{
                buf[ind] = 0;
            }
        }
    }
}
}

function showHeight(){  // for debugging only
for(var i = 0; i < sand.length; i ++){
    buf[i] = 0xff000000;
    var k = sand[i];
    buf[i] +=(k <<16) + (k<<8) + (k);
}
}

// main update function
function display(){
if(!ready){  // only when ready
    return;
}
//ctx.setTransform(1,0,0,1,0,0); // reset transform
ctx.clearRect(0,0,cw,ch);
var mx = Math.floor((mouse.x/cw)*w); // canvas buf mouse pos
var my = Math.floor((mouse.y/ch)*h);

// drop sand
if(mouse.buttonRaw & 4){
    for(var i = 0; i < 120; i ++){
        var dir = Math.random()*Math.PI;
        var dist = ((Math.random()+Math.random()+Math.random())/3-0.5) * 62;
        var x = Math.cos(dir) * dist;
        var y = Math.sin(dir) * dist;
        x += mx;
        y += my;
        x = Math.floor(x); // floor
        y = Math.floor(y); // floor
       
        sprinkle(x,y);
    }
}else{
    // drop sand for intro FX
    if(sandReady <sandToFallCount){
        for(var i = 0; i < 120; i ++){        
            if(sandToFall[sandReady] !== 0){
                sprinkle(sandToFall[sandReady] + offsets[Math.floor(Math.random()*8)%offsets.length]);
            }
            sandReady += 1;
        }
    }
}
   // push sand about.
   if(mouse.buttonRaw & 1){
   push(((mouse.x/cw)*w),((mouse.y/ch)*h),32); // scale mouse to canvasBuf size
}
update();
renderPix();
//showHeight();
ctxB.putImageData(pixels,0,0);
ctx.drawImage(canvasBuf,0,0,cw,ch);

}








//==================================================================================================
// The following code is support code that provides me with a standard interface to various forums.
// It provides a mouse interface, a full screen canvas, and some global often used variable 
// like canvas, ctx, mouse, w, h (width and height), globalTime
// This code is not intended to be part of the answer unless specified and has been formated to reduce
// display size. It should not be used as an example of how to write a canvas interface.
// By Blindman67
const U = undefined;const RESIZE_DEBOUNCE_TIME = 100;
var canvas,ctx,mouse,createCanvas,resizeCanvas,setGlobals,globalTime=0,resizeCount = 0; 

createCanvas = function () { var c,cs; cs = (c = document.createElement("canvas")).style; cs.position = "absolute"; cs.top = cs.left = "0px"; cs.zIndex = 1000; document.body.appendChild(c); return c;}
resizeCanvas = function () {
if (canvas === U) { canvas = createCanvas(); } canvas.width = window.innerWidth; canvas.height = window.innerHeight; ctx = canvas.getContext("2d"); 
if (typeof setGlobals === "function") { setGlobals(); } if (typeof onResize === "function"){ resizeCount += 1; setTimeout(debounceResize,RESIZE_DEBOUNCE_TIME);}
}
function debounceResize(){ resizeCount -= 1; if(resizeCount <= 0){ onResize();}}
setGlobals = function(){ cw = w = canvas.width; ch = h = canvas.height; mouse.updateBounds(); }
mouse = (function(){
function preventDefault(e) { e.preventDefault(); }
var mouse = {
    x : 0, y : 0, w : 0, alt : false, shift : false, ctrl : false, buttonRaw : 0, over : false, bm : [1, 2, 4, 6, 5, 3], 
    active : false,bounds : null, crashRecover : null, mouseEvents : "mousemove,mousedown,mouseup,mouseout,mouseover,mousewheel,DOMMouseScroll".split(",")
};
var m = mouse;
function mouseMove(e) {
    var t = e.type;
    m.x = e.clientX - m.bounds.left; m.y = e.clientY - m.bounds.top;
    m.alt = e.altKey; m.shift = e.shiftKey; m.ctrl = e.ctrlKey;
    if (t === "mousedown") { m.buttonRaw |= m.bm[e.which-1]; }  
    else if (t === "mouseup") { m.buttonRaw &= m.bm[e.which + 2]; }
    else if (t === "mouseout") { m.buttonRaw = 0; m.over = false; }
    else if (t === "mouseover") { m.over = true; }
    else if (t === "mousewheel") { m.w = e.wheelDelta; }
    else if (t === "DOMMouseScroll") { m.w = -e.detail; }
    if (m.callbacks) { m.callbacks.forEach(c => c(e)); }
    if((m.buttonRaw & 2) && m.crashRecover !== null){ if(typeof m.crashRecover === "function"){ setTimeout(m.crashRecover,0);}}        
    e.preventDefault();
}
m.updateBounds = function(){
    if(m.active){
        m.bounds = m.element.getBoundingClientRect();
    }
    
}
m.addCallback = function (callback) {
    if (typeof callback === "function") {
        if (m.callbacks === U) { m.callbacks = [callback]; }
        else { m.callbacks.push(callback); }
    } else { throw new TypeError("mouse.addCallback argument must be a function"); }
}
m.start = function (element, blockContextMenu) {
    if (m.element !== U) { m.removeMouse(); }        
    m.element = element === U ? document : element;
    m.blockContextMenu = blockContextMenu === U ? false : blockContextMenu;
    m.mouseEvents.forEach( n => { m.element.addEventListener(n, mouseMove); } );
    if (m.blockContextMenu === true) { m.element.addEventListener("contextmenu", preventDefault, false); }
    m.active = true;
    m.updateBounds();
}
m.remove = function () {
    if (m.element !== U) {
        m.mouseEvents.forEach(n => { m.element.removeEventListener(n, mouseMove); } );
        if (m.contextMenuBlocked === true) { m.element.removeEventListener("contextmenu", preventDefault);}
        m.element = m.callbacks = m.contextMenuBlocked = U;
        m.active = false;
    }
}
return mouse;
})();
function main(timer){ // Main update loop
globalTime = timer;
display();  // call demo code
requestAnimationFrame(main);
}
resizeCanvas(); 
mouse.start(canvas,true); 
window.addEventListener("resize",resizeCanvas); 
requestAnimationFrame(main);



