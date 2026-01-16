let tileSize = 40;
let cols, rows;

// Labyrinthe
let maze;

// Joueur
let player = { x: 1*tileSize+2, y: 1*tileSize+2, size: tileSize-4, speed: 4 };

// Objets
let objects = [];
let popupImg = null;
let popupActive = false;
let activeObject = null;

// Offset pour scrolling
let offsetX = 0;
let offsetY = 0;

// --- Chargement des images ---
function preload(){
  objects = [
    {x:0, y:0, thumb: loadImage("image01_web.jpg"), full: loadImage("image01_huge.jpg")},
    {x:0, y:0, thumb: loadImage("image02_web.jpg"), full: loadImage("image02_huge.jpg")},
    {x:0, y:0, thumb: loadImage("image03_web.jpg"), full: loadImage("image03_huge.jpg")}
  ];
}

// --- Mélange aléatoire ---
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}

// --- Génération du labyrinthe ---
function generateMaze(cols, rows){
  let maze = Array(rows).fill(0).map(()=>Array(cols).fill(1));
  function carve(x,y){
    maze[y][x]=0;
    const dirs = shuffle([[0,-1],[1,0],[0,1],[-1,0]]);
    for(const [dx,dy] of dirs){
      const nx = x + dx*2;
      const ny = y + dy*2;
      if(nx>0 && nx<cols && ny>0 && ny<rows && maze[ny][nx]===1){
        maze[y+dy][x+dx]=0;
        carve(nx, ny);
      }
    }
  }
  carve(1,1);
  return maze;
}

// --- Setup ---
function setup(){
  createCanvas(windowWidth, windowHeight);
  setupMazeAndObjects();
}

function setupMazeAndObjects(){
  cols = floor((windowWidth*0.9)/tileSize);
  rows = floor((windowHeight*0.9)/tileSize);
  if(cols%2===0) cols--; 
  if(rows%2===0) rows--;

  maze = generateMaze(cols, rows);

  for(let obj of objects){
    let x,y;
    do{
      x = floor(random(cols));
      y = floor(random(rows));
    }while(maze[y][x]!==0 || (x===1 && y===1));
    obj.x = x;
    obj.y = y;
  }
}

// --- Fenêtre redimensionnée ---
function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  setupMazeAndObjects();
}

// --- Draw ---
function draw(){
  background(34);

  let mazeWidth = cols*tileSize;
  let mazeHeight = rows*tileSize;
  offsetX = player.x - width/2 + player.size/2;
  offsetY = player.y - height/2 + player.size/2;
  if(mazeWidth < width) offsetX = - (width-mazeWidth)/2; else offsetX = constrain(offsetX,0,mazeWidth-width);
  if(mazeHeight < height) offsetY = - (height-mazeHeight)/2; else offsetY = constrain(offsetY,0,mazeHeight-height);

  // Dessiner labyrinthe
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      if(maze[r][c]===1){
        fill(68);
        rect(c*tileSize - offsetX, r*tileSize - offsetY, tileSize, tileSize);
      }
    }
  }

  movePlayer();

  // Dessiner les thumbnails croppés
  for(let obj of objects){
    let size = min(obj.thumb.width, obj.thumb.height);
    let sx = (obj.thumb.width - size)/2;
    let sy = (obj.thumb.height - size)/2;
    image(obj.thumb, 
          obj.x*tileSize - offsetX, 
          obj.y*tileSize - offsetY, 
          tileSize, tileSize,   // taille à l'écran
          sx, sy, size, size   // crop source
    );
  }

  // Vérifier collision joueur-objet
  if(!popupActive){
    for(let obj of objects){
      let px = player.x + player.size/2;
      let py = player.y + player.size/2;
      let ox = obj.x*tileSize + tileSize/2;
      let oy = obj.y*tileSize + tileSize/2;
      if(dist(px,py,ox,oy)<tileSize/2) showImagePopup(obj.full, obj);
    }
  }

  // Dessiner joueur
  fill('deepskyblue');
  rect(player.x - offsetX, player.y - offsetY, player.size, player.size);

  drawPopup();
}

// --- Détection collision ---
function isCollidingWithMaze(x,y){
  let corners=[[x,y],[x+player.size,y],[x,y+player.size],[x+player.size,y+player.size]];
  for(let [cx,cy] of corners){
    let col=floor(cx/tileSize);
    let row=floor(cy/tileSize);
    if(row<0||row>=rows||col<0||col>=cols) return true;
    if(maze[row][col]===1) return true;
  }
  return false;
}

// --- Déplacement joueur ---
function movePlayer(){
  let nextX=player.x, nextY=player.y;
  if(keyIsDown(UP_ARROW)) nextY-=player.speed;
  if(keyIsDown(DOWN_ARROW)) nextY+=player.speed;
  if(keyIsDown(LEFT_ARROW)) nextX-=player.speed;
  if(keyIsDown(RIGHT_ARROW)) nextX+=player.speed;

  if(!isCollidingWithMaze(nextX, player.y)) player.x=nextX;
  if(!isCollidingWithMaze(player.x, nextY)) player.y=nextY;
  player.x = constrain(player.x,0,cols*tileSize - player.size);
  player.y = constrain(player.y,0,rows*tileSize - player.size);
}

// --- Popup image ---
function showImagePopup(img,obj){
  popupActive=true;
  popupImg=img;
  activeObject=obj;
}

function drawPopup(){
  if(popupActive && popupImg){
    push();
    fill(0,180);
    rect(0,0,width,height);

    // Afficher l'image entière (ratio respecté)
    let ratio = popupImg.width / popupImg.height;
    let maxW = width*0.8;
    let maxH = height*0.8;
    let w=maxW, h=maxH;
    if(ratio>1){ h=w/ratio; if(h>maxH){ h=maxH; w=h*ratio; } }
    else { w=h*ratio; if(w>maxW){ w=maxW; h=w/ratio; } }

    imageMode(CENTER);
    image(popupImg, width/2, height/2, w, h);
    pop();

    fill(255);
    textAlign(CENTER);
    textSize(16);
    text("Appuie sur ESPACE ou clique pour fermer", width/2, height-30);
  }
}

// --- Fermer popup + déplacer objet ---
function closePopup(){
  popupActive=false;
  if(activeObject){
    let x,y;
    do{
      x=floor(random(cols));
      y=floor(random(rows));
    }while(maze[y][x]!==0);
    activeObject.x=x;
    activeObject.y=y;
    activeObject=null;
  }
}

function keyPressed(){
  if(popupActive && key===' ') closePopup();
}

function mousePressed(){
  if(popupActive) closePopup();
}