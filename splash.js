
let currentProjectname;
let currentKernelMode;
let currentKernelModeName;
let currentTool;
let currentToolFunctions = toolFunctions[currentTool];
let currentInkMode = 'toggle';
let currentInkBoolean = false; 
let currentTVMode = 'ntsc';
let currentFGColor = '0E';
let currentBGColor = '00';
let currentColorPickerTarget='fg';
let currentFont;
let currentTextPixels = [];
let currentStartMouseX;
let currentStartMouseY;
let currentHotSpots = [];
let currentClipboard = [];

let currentUploadedImage;
let currentShowingUploadedImage;
let currentContrast = 128;
let currentInvert = false;
let currentFGBG = 'fg';
let currentEyedrop = false;


let currentGradFGStart = '00';
let currentGradFGStop = '0E';
let currentGradBGStart = '00';
let currentGradBGStop = '0E';
let currentGradFGBG = 'fg';

let currentScanlinesPer = 1;

let W;
let H;
let PIXW;
let PIXH;


let yxGrid = Array();
let colorGrid = Array();
let colorBgGrid = Array();

const undoStack = [];

let sx,sy,ex,ey;



function preload(){
  // currentUploadedImage = loadImage('doublefine.png');
  // currentShowingUploadedImage = currentUploadedImage;
}

function setup() {
  
  populateKernelSelectList();

  const initialKernel = 'player48color';  //  'player48color' 'SymPFMirrored','SymPFRepeated','bbPFDPCcolors' 'AssymPFRepeated', 'AssymPFMirrored','player48mono','bBTitle_48x2'
  document.getElementById('selectKernel').value = initialKernel;

  setKernelMode(initialKernel);
  currentKernelModeName = initialKernel;
  
  document.getElementById("drawtool").click();
//drawtool
//gradianttool

  clearYXGrid();
  createCanvas(W * PIXW, H * PIXH).parent('canvasParent');
  //makePicker();
  setFont('tiny3ishx4');
  //document.getElementById("picktext").click();

  document.getElementById('scanlinecount').value = 1;
  setScanlinesPer(1);


  createFileInput(loadImageFile).parent("imagefileButtonWrapper");
  createFileInput(loadProjectFile).parent("projectfileButtonWrapper");

  makeGradiantTable();
  blockCanvasContextMenus();
}

function blockCanvasContextMenus(){
    for (let element of document.getElementsByClassName("p5Canvas")) {
      element.addEventListener("contextmenu", (e) => e.preventDefault());
    }
}


function clearYXGrid() {
  yxGrid = makeUpBlankGrid();
}
function makeUpBlankGrid(){
  const grid = Array();
  for (let y = 0; y < 256; y++) {
    grid[y] = Array();
  }
  return grid;
}


function loadImageFile(file){
  if (file.type === 'image') {
    currentUploadedImage = createImg(file.data, '');
    currentUploadedImage.hide();
    launchReadImage(true);
    draw();

  } else {
    currentUploadedImage = null;
  }  
}


function getDownloadButtonHTML(key, guts){
  const caption = guts.caption ? guts.caption : `download ${guts.file}`;
  return `<button onclick="doModeDownload('${key}')">${caption}</button>`;
}


function setKernelMode(modestring, preserveHeight){
  const mode = modes[modestring];

  currentKernelMode = mode;
  currentKernelModeName = modestring;


  const{ATARI_WIDTH, ATARI_STARTHEIGHT, 
        SCREEN_WIDTH_PER, SCREEN_HEIGHT_PER, ATARI_MAXHEIGHT, LINEHEIGHTS,
        DOWNLOADS, MININUM, OVERLAYS,
        MULTICOLORBG , DESCRIPTION} = mode;



  document.getElementById("kerneldesc").innerHTML = DESCRIPTION;

  document.getElementById("height").value = ATARI_STARTHEIGHT;
  document.getElementById("maxheight").innerHTML = ATARI_MAXHEIGHT;
  
  document.getElementById("info").style.width = `${W*PIXW}px`;
  
  const buttonWrapper =  document.getElementById("downloadButtonWrapper");
  if(DOWNLOADS) {
    const guts = Object.keys(DOWNLOADS).map((key)=>getDownloadButtonHTML(key,DOWNLOADS[key])).join(" ");
    buttonWrapper.innerHTML = guts;
  } else {
    buttonWrapper.innerHTML = '';
  }
  

  document.getElementById("mininumwrap").style.display = MININUM ? 'block' : 'none';
  
  document.getElementById("gradiantFGBG").style.display = MULTICOLORBG ? 'inline-block' : 'none';
  if(!MULTICOLORBG) {
    currentGradFGBG = 'fg';
  }

  document.getElementById("radiofg").style.visibility = MULTICOLORBG ? 'visible' : 'hidden';
  document.getElementById("radiobg").style.visibility = MULTICOLORBG ? 'visible' : 'hidden';


  fillBlankColorGridWithDefault();

  if(mode.PIXDUP){
    duplicateYXGridHalves();
  }
  
  document.getElementById('scanlinecount').style.display = LINEHEIGHTS ? 'block' : 'none';
  if(! LINEHEIGHTS) {
    currentScanlinesPer = 1;
    document.getElementById('scanlinecount').value = 1;
  }
  setScanlinesPer(currentScanlinesPer);
  
  W = ATARI_WIDTH;
  
  if(!preserveHeight){
    H = ATARI_STARTHEIGHT;
  }
  PIXW = SCREEN_WIDTH_PER;
  PIXH = SCREEN_HEIGHT_PER * currentScanlinesPer;

  resizeCanvas(W*PIXW, H * PIXH);
  loop();
}

function fillBlankColorGridWithDefault(){
  if(currentKernelMode.MULTICOLOR){
    for(let y = 0; y < H; y++){
      if(! colorGrid[y]){
        colorGrid[y] = currentFGColor;
      }
    }
  }
  if(currentKernelMode.MULTICOLORBG){
    for(let y = 0; y < H; y++){
      if(! colorBgGrid[y]){
        colorBgGrid[y] = currentBGColor;
      }
    }
  }
}

function invertGrid(){
  for(let gridY = 0; gridY < H; gridY++){
    for(let gridX = 0; gridX < W; gridX++){
      yxGrid[gridY][gridX] = !yxGrid[gridY][gridX];
    }
  }
  loop();
}

function getColorForRow(y,half){
  const alpha = half?'87':'';
  if(! currentKernelMode.MULTICOLOR){
    return `#${HUELUM2HEX[currentTVMode][currentFGColor]}${alpha}`;
  }
  if(! colorGrid[y]) {
    return `#ffffff${alpha}`;
  }
  return `#${HUELUM2HEX[currentTVMode][colorGrid[y]]}${alpha}`;
  
}
function getBgColorForRow(y){
  if(! currentKernelMode.MULTICOLOR){
    return `#${HUELUM2HEX[currentTVMode][currentBGColor]}`;
  }
  if(! colorBgGrid[y]){
    return `#000000`;
  }
  return `#${HUELUM2HEX[currentTVMode][colorBgGrid[y]]}`;

}


function draw() {

  background(`#${HUELUM2HEX[currentTVMode][currentBGColor]}`);
  
  if(currentShowingUploadedImage){
      image(currentShowingUploadedImage, 0, 0, width, height);
      return;
  }

  noStroke();

  if(currentKernelMode.MULTICOLORBG){
    for (let y = 0; y < H; y++) {
      fill(getBgColorForRow(y));
      rect(0,y * PIXH, width, PIXH)
    }
  }

const horizgapsize = currentKernelMode.HORIZGAP ? 2 : 0
for (let x = 0; x < W; x++) {
  for (let y = 0; y < H; y++) {
    fill(getColorForRow(y));
    if (yxGrid[y][x]) rect(x * PIXW, y * PIXH, PIXW, PIXH-horizgapsize);
  }
}


strokeWeight(1);
let x = int(mouseX/PIXW); 
let y = int(mouseY/PIXH);
noFill();
stroke(getColorForRow(y));
if(currentToolFunctions.showHover()){
  rect(x * PIXW, y * PIXH, PIXW, PIXH);
}

// show hot spots for rect tool or line tool, etc...
if(currentToolFunctions.showHotSpots()){
  //half tone current color or black
  
    currentHotSpots.map((spot)=>{
        //console.log();
        //fill(255,0,0);
        fill(currentInkBoolean ? getColorForRow(spot.y,true) : `#00000087`);
        stroke(currentInkBoolean ? getColorForRow(spot.y,true) : `#00000087`);
        rect(spot.x * PIXW, spot.y * PIXH, PIXW, PIXH); 
    });
}


if(currentKernelMode.MULTICOLOR && ! currentShowingUploadedImage){
  for(let y = 0; y < H; y++){
    noStroke();
    fill(getColorForRow(y));
    rect(width - PIXW/4,y * PIXH,PIXW/4,PIXH);
  }
} 

if(currentKernelMode.OVERLAYS) {
  currentKernelMode.OVERLAYS.forEach( (fn) => fn() );
}

noLoop();

}


function drawPFOverlay() {
  // overlay pf divisions here
  let pf0x = PIXW * 4, pf1x = PIXW * 12, pf2x = PIXW * 20;
  stroke(0,0,255);
  noFill();
  drawingContext.setLineDash([5, 5]);
  strokeWeight(1);
  line(pf0x, 0, pf0x, height);
  line(pf1x, 0, pf1x, height);
  line(pf2x, 0, pf2x, height);
  if (currentKernelMode.PIXDUP === 'mirror') {
    // mirror
    line(width - pf0x, 0, width - pf0x, height);
    line(width - pf1x, 0, width - pf1x, height);
  } else {
    // repeat
    line(pf2x + pf0x, 0, pf2x + pf0x, height);
    line(pf2x + pf1x, 0, pf2x + pf1x, height);
  }
}

function drawHOverlay(spacing) {
  // horizontal divisions
  for (let y = 0; y < height; y += PIXH * spacing) {
    line(0, y, width, y);
  }
}

function drawTestSprite() {
  fill(255, 255, 0);
  ellipse(
    width / 2,
    height / 2,
    8 * PIXW / 4);
}

function mousePressed() {

  makeUndoSnapshot();

const gridX = int(mouseX / PIXW);
const gridY = int(mouseY / PIXH);

if(currentInkMode == 'toggle') {
  currentInkBoolean = !getInYXGrid(gridX,gridY);
} else if(currentInkMode == 'leftright') {
  currentInkBoolean = (mouseButton == LEFT);
} else {
  currentInkBoolean = (currentInkMode == 'draw');
}
currentToolFunctions.mousePressed(gridX,gridY);
  loop();
}

function mouseDragged() {
  const sx = pmouseX;
  const sy = pmouseY;
  const ex = mouseX;
  const ey = mouseY;

  currentToolFunctions.mouseDragged(sx,sy,ex,ey);
  loop();
}

function mouseMoved(){
  const gridX = int(mouseX / PIXW);
  const gridY = int(mouseY / PIXH);
  currentToolFunctions.mouseMoved(gridX,gridY);
  loop();
}

function mouseReleased(){  
  
    makeUndoSnapshot();

    currentToolFunctions.mouseReleased();
  
  loop();
}




const toolsWithSections = ["text","color","select", "gradiant"];

function setTool(what){
  
  currentTool = what;   
  currentToolFunctions = toolFunctions[what];

  stopEyedrop();

  cursor(ARROW);

  if(currentToolFunctions.cursor){
    cursor(currentToolFunctions.cursor);
  }

  toolsWithSections.forEach((tool) => {
    document.getElementById(`section${tool}`).style.display = 'none';
  });
  if(toolsWithSections.includes(what)) {
    document.getElementById(`section${what}`).style.display = 'block';
  }
  currentHotSpots = [];
  loop();

}

function setInkmode(what){
  currentInkMode = what;
  currentInkBoolean = (what == 'erase') ? false : true;
}



function setNewHeight(){
  const elem = document.getElementById('height');
  let newHeight = parseInt(elem.value);
  
  elem.classList.remove("error");

  if(isNaN(newHeight) || newHeight < 0) {
    elem.classList.add("error");
    return;
  }

  if(newHeight * currentScanlinesPer > currentKernelMode.ATARI_MAXHEIGHT){
    newHeight = floor(currentKernelMode.ATARI_MAXHEIGHT / currentScanlinesPer);
    elem.value = newHeight;
  }


  const oldgrid = yxGrid;
  yxGrid = Array();
  let y;
  for (y = 0; y < min(H,newHeight); y++) {
    if(y < newHeight) yxGrid[y] = oldgrid[y];
  }
  for (; y < newHeight; y++) {
    yxGrid[y] = Array();
  }
  
  H = newHeight;
  resizeCanvas(W * PIXW, H * PIXH);

  fillBlankColorGridWithDefault();
}


function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.visibility = 'hidden';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}



function makePicker(which){
  
  const parentElem = document.getElementById(`colorPickerHolder_${which}`);

  const table = document.createElement("table");
  table.classList.add("colorpick");

  
  table.innerHTML = '<tr><td  colspan="8" onclick="closeAtariColorPicker()">X</td></tr>';

  
  for(let lum = 0; lum < 16; lum++){
    const tr  = document.createElement("tr");
    for(let hue = 0; hue < 16; hue+=2) {
      
      const atariKey = `${lum.toString(16)}${hue.toString(16)}`.toUpperCase();
        const hexColor = `#${HUELUM2HEX[currentTVMode][atariKey]}`;
        
        const td = document.createElement("td");
        td.classList.add((textClassForHexBg(hexColor)));
        td.innerHTML = atariKey;
        td.setAttribute('bgcolor',hexColor);
        td.onclick = () =>{
          clickAtariColor(atariKey);
        };
        tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  parentElem.innerHTML = '';
  parentElem.appendChild(table);
  
}
function removePicker(which){
  const parentElem = document.getElementById(`colorPickerHolder_${which}`);
  parentElem.innerHTML = '';
}

function textClassForHexBg(hexColor){
  const{r,g,b} = hexToRgb(hexColor);
  return (r+g+b) < 420 ? 'light':'dark';
}


// thanks https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}


function openAtariColorPicker(which){
  if(currentColorPickerTarget) removePicker(currentColorPickerTarget);
  currentColorPickerTarget = which;
  makePicker(currentColorPickerTarget);
}
function closeAtariColorPicker(){
  removePicker(currentColorPickerTarget);
}
function clickAtariColor(atariKey){
  if(currentColorPickerTarget == 'fg') {
    setFGColor(atariKey);
    document.getElementById("radiofg").click();
  }
  if(currentColorPickerTarget == 'bg') {
    setBGColor(atariKey);
    document.getElementById("radiobg").click();
  }
  if(currentColorPickerTarget == 'gradfgstart') setCurrentGradFGStart(atariKey);
  if(currentColorPickerTarget == 'gradfgstop') setCurrentGradFGStop(atariKey);
  if(currentColorPickerTarget == 'gradbgstart') setCurrentGradBGStart(atariKey);
  if(currentColorPickerTarget == 'gradbgstop') setCurrentGradBGStop(atariKey);
  closeAtariColorPicker();
  if(!currentKernelMode.MULTICOLOR && currentColorPickerTarget == 'fg'){
    document.getElementById("drawtoolradio").click(); //automatically start drawing if mono...
  }

  makeGradiantTable();
}


function setTVMode(mode){
  currentTVMode = mode;
  //makePicker();
  displayCurrentFGColor();
  displayCurrentBGColor();
  displayCurrentGradiantColors();
  makeGradiantTable();
}
function setFGColor(atariKey){
  currentFGColor = atariKey;
  displayCurrentFGColor();
}
function setBGColor(atariKey){
  currentBGColor = atariKey;
  displayCurrentBGColor();
}
function setCurrentGradFGStart(atariKey){
  currentGradFGStart = atariKey;
  displayCurrentGradiantColors();
}
function setCurrentGradFGStop(atariKey){
  currentGradFGStop = atariKey;
  displayCurrentGradiantColors();
}
function setCurrentGradBGStart(atariKey){
  currentGradBGStart = atariKey;
  displayCurrentGradiantColors();
}
function setCurrentGradBGStop(atariKey){
  currentGradBGStop = atariKey;
  displayCurrentGradiantColors();
}


function setCurrentGradFGBG(atariKey){
  currentGradFGBG = atariKey;
}

function displayCurrentGradiantColors(){
  console.log('displayCurrentGradiantColors');
  const elemStart = document.getElementById('currentGradStart');
  const elemStop = document.getElementById('currentGradStop');
  showAtariColorOnElem(elemStart, currentGradFGBG == 'fg'? currentGradFGStart : currentGradBGStart );
  showAtariColorOnElem(elemStop, currentGradFGBG == 'fg'? currentGradFGStop : currentGradBGStop );
}


function setFGvsBG(which){
  currentFGBG = which;
}


function displayCurrentFGColor(){
  const elem = document.getElementById('currentFG');
  showAtariColorOnElem(elem,currentFGColor);
}
function displayCurrentBGColor(){
  const elem = document.getElementById('currentBG');
  showAtariColorOnElem(elem,currentBGColor);
}


function showAtariColorOnElem(elem, atariColor){
  elem.innerHTML = atariColor;
  const hexColor = `#${HUELUM2HEX[currentTVMode][atariColor]}`;
  elem.style.backgroundColor = hexColor;
  elem.classList.remove("light");
  elem.classList.remove("dark");
  
  elem.classList.add(textClassForHexBg(hexColor));
  console.log(elem.classList);
  loop();
}


function setFont(fontname) {
  currentFont = fonts[fontname];
  setTextPixels();
}
function setTextPixels(){
  const text = document.getElementById('text').value;
  const letters = text.split("");

  const letterToLines = {};

  const fontLines = currentFont.split('\n');
  const fontWidth = int(fontLines[0]);
  const fontHeight = int(fontLines[1]);
  let ptr = 2;
  while(ptr < fontLines.length){
    let buf = "";
    const c = fontLines[ptr];
    for(let i = 1; i <= fontHeight; i++){
      buf += `${fontLines[ptr + i ]}\n`;
    }
    letterToLines[c] = buf;
    ptr += int(fontHeight) + 1;
  }
  
  let left = 0;

  currentTextPixels = [];

  letters.forEach((letter)=>{
    if(letter === ' ') {
      left += 2;
    } else {
      const {pixels,width} = parseLetterLines(letterToLines[letter],left);
      currentTextPixels = currentTextPixels.concat(pixels);
      left += width;
    }
  });
  loop();
}

function parseLetterLines(linebuf, startWidth){
  const lines = linebuf.split("\n");

  const rawpairs = [];
  let maxX = 0;
  for(let y = 0; y < lines.length; y++){
    const line = lines[y];
    const bits = line.split('');
    for(let x = 0; x < bits.length; x++){
      const bit = bits[x];
      if(bit === 'X') {
        rawpairs.push({x,y});
        if(x > maxX) maxX = x;
      }

    }
  }
  const width = maxX + 2;
  const pixels = [];
  rawpairs.forEach((pair)=>{
    let {x,y} = pair;
    x += startWidth;
    pixels.push({x,y});
  });
  return {pixels,width};
}

/**
 *
 * 
 * At some point the following might be more effecient way of 
 * reading in the damn pixels, but couldn't quite get it to work
 * 
function readImageFromArray(){
  if(! currentUploadedImage) return;
  clearYXGrid();

  currentShowingUploadedImage = currentUploadedImage;
  loop();
  loadPixels();
  console.log(pixels);
  const d = pixelDensity();
  for(let x = 0; x < W; x++){
    for(let y = 0; y < H; y++){
      const squareBoolean = readSquareFromArray(x,y,pixels,d);
      //console.log(squareBoolean);
      yxGrid[y][x] = !currentInvert ? squareBoolean: !squareBoolean ;
    }
  }
}

function readSquareFromArray(x,y,pixels,d){
  const squarecount = PIXW * PIXH; 
  let sum = 0;
  for(let px = x * PIXW; px < (x+1) * PIXW; px++){
    for(let py = y * PIXH; py < (y+1) * PIXH ; py++){
      // see https://p5js.org/reference/#/p5/pixels for example that has to loop over the density??
      const loc = 4 * d *  (x + (width * y)); //this needs to be fixed: 
      const r = pixels[loc];
      const g = pixels[loc+1];
      const b = pixels[loc+2];
      console.log({loc,r,g,b});
      sum += (r + g + b) / 3;
    }
  }
 // console.log((sum / squarecount),currentContrast,(sum / squarecount) > currentContrast);
  return (sum / squarecount) > currentContrast;
}
**/ 
function currentLoadingDisplay(show) {
  document.getElementById('importmsg').style.visibility = show ? 'visible':'hidden';
}
// we want to update screen elements but with a timeout to get it out of the redraw loop
function launchReadImage(adjustContrast) {
  if(! currentUploadedImage) return;
  currentLoadingDisplay(true);
  setTimeout(()=>{readImage(adjustContrast)}, 0);
}

function readImage(adjustContrast){
  clearYXGrid();
  
  currentShowingUploadedImage = currentUploadedImage;
  draw();

  
  if(adjustContrast) {
    //const {contrast,grid} = findGridWithBestContrast();
    const {contrast,grid} = findGridWithMostContrastingNeighbors();
    yxGrid = grid;
    
    document.getElementById("contrast").value = contrast;
  } else {
    const {grid,pixelCount} = resampleImage(currentContrast);
    yxGrid = grid; 
    console.log(adjustContrast,pixelCount,W*H);
  }
  console.log('parsed image');
  currentShowingUploadedImage = null;
  currentLoadingDisplay(false);
  draw();
}


// we guesstimate that good images will have about half the pixels visible...
// at least better than all dark or all light

function findGridWithBestContrast(){
  const results = {};
  
  for(let contrast = 2; contrast <= 255; contrast+=50){
    results[contrast] = resampleImage(contrast);
  }
  const targetPixelCount = (W * H) / 2;
  let bestContrastSoFar = undefined;

  Object.keys(results).forEach((contrast)=>{
    console.log('test',contrast,results[contrast])
    if(! bestContrastSoFar) {
      bestContrastSoFar = contrast;
    } else {
      const test = results[contrast];
      if(abs(targetPixelCount - test.pixelCount) < abs(targetPixelCount - results[bestContrastSoFar].pixelCount)){
        bestContrastSoFar = contrast;
      }
    }
    
  });
  //bestContrastSoFar = 202;
  return {grid:results[bestContrastSoFar].grid, contrast:bestContrastSoFar};
}

function findGridWithMostContrastingNeighbors(){
  const results = {};
  
  for(let contrast = 2; contrast <= 255; contrast+=50){
    results[contrast] = resampleImage(contrast);
    console.log(contrast);
    results[contrast].neighborCount = getContrastingNeighborCount(results[contrast].grid);
  }
  let bestContrastSoFar = undefined;
  Object.keys(results).forEach((contrast)=>{
    if(! bestContrastSoFar) {
      bestContrastSoFar = contrast;
    } else {
      if(results[contrast].neighborCount > results[bestContrastSoFar].neighborCount){
        bestContrastSoFar = contrast;
      }
    }
  });
  return {grid:results[bestContrastSoFar].grid, contrast:bestContrastSoFar};
}

function getContrastingNeighborCount(grid){
  let count = 0;
  for(let x = 0; x < W; x++){
    for(let y = 0; y < H; y++){
      count += getContrastingNeighborCountForXY(grid,x,y);
    }
  }
  return count;
}
function getContrastingNeighborCountForXY(grid,x,y){
  const neighborDeltas = [ [-1,0],[1,0], [0,1],[0,-1]];
  let count = 0;
  neighborDeltas.forEach((delta)=>{
    [nx,ny] = delta;
    if(isInBounds(nx,ny) && grid[y][x] != grid[ny][nx] ) count++;
  });
  return count;
}
function isInBounds(x,y){
  return (x >= 0 && x < W && y >= 0 && y < H);
}

function resampleImage(contrast){
  const grid = makeUpBlankGrid();
  let pixelCount = 0;
  for(let x = 0; x < W; x++){
    for(let y = 0; y < H; y++){
      const squareBoolean = readSquare(x,y,contrast);

      pixelCount += squareBoolean ? 1 : 0;
      //console.log(squareBoolean);
      grid[y][x] = !currentInvert ? squareBoolean: !squareBoolean ;
    }
  }
  return {grid, pixelCount};
}

function readSquare(x,y,contrast){
  const squarecount = PIXW * PIXH; 
  let sum = 0;
  for(let px = x * PIXW; px < (x+1) * PIXW; px++){
    for(let py = y * PIXH; py < (y+1) * PIXH ; py++){
      const [r,g,b,a] = get(px,py);
      sum += (r + g + b) / 3;
    }
  }
 // console.log((sum / squarecount),currentContrast,(sum / squarecount) > currentContrast);
  return (sum / squarecount) > contrast;
}

function handleContrast(){
  currentContrast = document.getElementById("contrast").value;
  launchReadImage(false);
}

function handleInvert(){
  currentInvert = document.getElementById("invert").checked;
  launchReadImage(false);
}

function startEyedrop(){
  currentEyedrop = true;
  cursor(CROSS); 
}
function stopEyedrop(){
  currentEyedrop = false;
  cursor(ARROW);
}

function setCurrentGradFGBG(what){
  currentGradFGBG = what;
  displayCurrentGradiantColors();
  makeGradiantTable();
}

function makeGradiantTable(){
  let stopcolor, startcolor;
  if(currentGradFGBG == 'fg'){
    startcolor = currentGradFGStart;
    stopcolor = currentGradFGStop;
  } else {
    startcolor = currentGradBGStart;
    stopcolor = currentGradBGStop;
  }

  const startcolorval = parseInt(startcolor, 16);
  const stopcolorval = parseInt(stopcolor, 16);
  const spotcount = 30;

  for(let i = 0; i < spotcount; i++){
    const elem = document.getElementById(`grad${i}`);

    const newColorValueInt = (parseInt(map(i,0,spotcount-1,startcolorval,stopcolorval)/2)*2);
    //uppser case,make two digits, prepadded  with 0
    const newColorValueHex = ('00'+newColorValueInt.toString(16).toUpperCase()).slice(-2);
    const hexColor = `#${HUELUM2HEX[currentTVMode][newColorValueHex]}`;

    elem.style.backgroundColor = hexColor;
  }
}

function openGradiantAtariColorPicker(startOrStop){
  openAtariColorPicker(`grad${currentGradFGBG}${startOrStop}`);
}


function saveProject(){
  const projectname = prompt("Project name?", currentProjectname || "");
  currentProjectname = projectname;

  const project = {
    project: currentProjectname,
    mode:currentKernelModeName,
    height: H,
    tvmode: currentTVMode,
    FGColor: currentFGColor,
    BGColor: currentBGColor,
    yxGrid,
    colorGrid,
    colorBgGrid,
    currentScanlinesPer
  };

  download(`${currentProjectname}.abb.json`,JSON.stringify(project,null,' ')); 
}

function loadProjectFile(file){
  const project = file.data;
  currentProjectname = project.project;
  
  currentKernelModeName = project.mode;
  
  H = project.height;
  yxGrid = project.yxGrid;
  colorGrid = project.colorGrid;
  colorBgGrid = project.colorBgGrid;
  currentTVMode = project.tvmode;
  currentFGColor = project.FGColor;
  currentBGColor = project.BGColor;
  currentScanlinesPer = project.currentScanlinesPer;

  const heightElem = document.getElementById('height');
  heightElem.value = H;

  setKernelMode(project.mode, true);
  showUIFromCurrent();
  loop();
}

function showUIFromCurrent(){
  document.getElementById("selectKernel").value = currentKernelModeName;
  document.getElementById("height").value = H;
  setFGColor(currentFGColor);
  setBGColor(currentBGColor);
  setTVMode(currentTVMode);
  setScanlinesPer(currentScanlinesPer);
  document.getElementById("scanlinecount").value = currentScanlinesPer;
  document.getElementById(`tv_${currentTVMode}`).checked = true;
  
}


//createFileInput(loadImageFile).parent("fileButtonWrapper");
// function loadImageFile(file){
//   if (file.type === 'image') {
//     currentUploadedImage = createImg(file.data, '');
//     currentUploadedImage.hide();
//     launchReadImage(true);
//     draw();

//   } else {
//     currentUploadedImage = null;
//   }  
// }

function makeUndoSnapshot(){
  const snapshot = JSON.stringify({yxGrid,colorGrid,colorBgGrid});

  const lastshot = undoStack.length > 0 ? undoStack[undoStack.length - 1] : '';

  if(snapshot != lastshot){
    undoStack.push(snapshot);
  } 
  //console.log('psuhed to ',undoStack.length);
}
function popUndo(){
  if(undoStack.length > 1) {
    undoStack.pop();
    const undo = JSON.parse(undoStack[undoStack.length - 1]);
    yxGrid = undo.yxGrid;
    colorGrid = undo.colorGrid;
    colorBgGrid = undo.colorBgGrid;
  }
  loop();

}



function duplicateYXGridHalves() {
  makeUndoSnapshot();
  for(let y = 0; y < yxGrid.length; y++){
    const row = yxGrid[y];
    for(let x = 0; x < currentKernelMode.ATARI_WIDTH / 2;  x++){
      row[getSymmPixel(x)] = row[x];
    }
  }
}

function setScanlinesPer(lines){
  currentScanlinesPer = lines;

  
  if(H * currentScanlinesPer > currentKernelMode.ATARI_MAXHEIGHT){
    H = floor(currentKernelMode.ATARI_MAXHEIGHT / currentScanlinesPer);
    document.getElementById('height').value = H;   
  }

  PIXH = currentKernelMode.SCREEN_HEIGHT_PER * currentScanlinesPer;
  resizeCanvas(W*PIXW, H * PIXH);

  const mulElem = document.getElementById('showmullinesper');
  if(lines == 1){
      mulElem.style.display = 'none';
  } else {
    mulElem.style.display = 'inline-block';
    mulElem.innerHTML = `* ${lines}`;
  }
}


function populateKernelSelectList(){
  const sel = document.getElementById('selectKernel');
  Object.keys(modes).forEach(thing =>{
    const key = thing;
    const name  = modes[key].NAME;
    sel.add(new Option(name,key));
  });

}



function doModeDownload(key){
  const {file,action} = currentKernelMode.DOWNLOADS[key]
  action(file);
}