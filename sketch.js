let playerX = 30;
let playerY;
let playerSize = 30;
let speed = 0;
let vSpeed = 0;
let light = "green";
let lightTimer = 30;
let gameOver = false;
let gameStarted = false;
let violationCooldown = 0;
let violationActive = false;
let obstacles = [];

let boomSound, startSound, duringSound, endSound;
let redSound, greenSound, lostSound;
let dollPic, squarePic, circlePic, trianglePic, playerPic;

let startPlaying = false;
let duringPlaying = false;
let endPlaying = false;

let showRetryButton = false;
let buttonX, buttonY, buttonW = 160, buttonH = 40;

function preload() {
  boomSound = loadSound("sounds/boom.mp3");
  startSound = loadSound("sounds/Start.mp3");
  duringSound = loadSound("sounds/During.mp3");
  endSound = loadSound("sounds/End.mp3");
  redSound = loadSound("sounds/RL.mp3");
  greenSound = loadSound("sounds/GL.mp3");
  lostSound = loadSound("sounds/lost.mp3");

  dollPic = loadImage("pictures/doll.png");
  squarePic = loadImage("pictures/square.png");
  circlePic = loadImage("pictures/circle.png");
  trianglePic = loadImage("pictures/triangle.png");
  playerPic = loadImage("pictures/player.png");
}

function setup() {
  createCanvas(1850, 440);
  playerY = height / 2 - 20;

  buttonX = width / 2 - buttonW / 2;
  buttonY = height - 35;

  setupObstacles();
}

function setupObstacles() {
  obstacles = [];
  let leftMargin = 100;
  let rightMargin = 80;
  let cols = 20;
  let xSpacing = (width - leftMargin - rightMargin) / cols;

  let typePool = [
    ...Array(6).fill("square"),
    ...Array(6).fill("circle"),
    ...Array(6).fill("triangle"),
    ...Array(cols - 18).fill("circle")
  ];
  shuffle(typePool, true);

  for (let i = 0; i < cols; i++) {
    let x = leftMargin + i * xSpacing + xSpacing / 2;
    let y = random(40, height - 80);
    obstacles.push({
      baseX: x,
      baseY: y,
      offsetX: random(TWO_PI),
      offsetY: random(TWO_PI),
      type: typePool[i]
    });
  }
}

function draw() {
  background(245, 245, 220);

  fill(255, 200, 150);
  rect(0, 0, 100, height - 40);

  fill(light === "green" ? 0 : 255, light === "green" ? 255 : 0, 0);
  rect(width - 80, 0, 100, height - 40);

  let dollWidth = 110;
  let dollHeight = 90;
  let dollX = width - 90 + (100 - dollWidth) / 2;
  let dollY = (height - 40 - dollHeight) / 2;
  image(dollPic, dollX, dollY, dollWidth, dollHeight);

  for (let obs of obstacles) {
    let x = obs.baseX + sin(frameCount * 0.05 + obs.offsetX) * 10;
    let y = obs.baseY + sin(frameCount * 0.07 + obs.offsetY) * 12;

    let pic, imgW, imgH;

    if (obs.type === "square") {
      pic = squarePic;
      imgW = 85;
      imgH = 75;
    } else if (obs.type === "circle") {
      pic = circlePic;
      imgW = 55;
      imgH = 75;
    } else {
      pic = trianglePic;
      imgW = 55;
      imgH = 75;
    }

    image(pic, x - imgW / 2, y - imgH / 2, imgW, imgH);
  }

  let inStartZone = playerX - playerSize / 2 < 100;
  if (!gameStarted && inStartZone && !startPlaying) {
    startSound.loop(); duringSound.stop(); endSound.stop();
    startPlaying = true; duringPlaying = false; endPlaying = false;
  } else if (gameStarted && !gameOver && !duringPlaying) {
    startSound.stop(); duringSound.loop(); endSound.stop();
    duringPlaying = true; startPlaying = false; endPlaying = false;
  } else if (gameOver === "win" && !endPlaying) {
    startSound.stop(); duringSound.stop(); endSound.loop();
    endPlaying = true; startPlaying = false; duringPlaying = false;
  }

  if (!gameOver) {
    playerX += speed;
    playerY += vSpeed;
    playerY = constrain(playerY, playerSize / 2, height - 60);

    if (!gameStarted && playerX - playerSize / 2 > 100) {
      gameStarted = true;
    }

    let inSafeZone = obstacles.some(obs => {
      let x = obs.baseX + sin(frameCount * 0.05 + obs.offsetX) * 10;
      let y = obs.baseY + sin(frameCount * 0.07 + obs.offsetY) * 12;
      return playerX > x && playerX < x + 80 && abs(playerY - y) < 40;
    });

    if (
      gameStarted && light === "red" && speed > 0 &&
      playerX - playerSize / 2 > 100 &&
      violationCooldown === 0 && !inSafeZone
    ) {
      violationActive = true;
      let progress = (playerX - 100) / (width - 180);
      violationCooldown = int(28 - progress * 16);
    }

    if (violationCooldown > 0) {
      violationCooldown--;
      if (violationCooldown === 0 && violationActive) {
        boomSound.play(); gameOver = "loss";
      }
    }

    if (gameStarted && playerX - playerSize / 2 >= width - 80) {
      gameOver = "win";
    }

    for (let obs of obstacles) {
      let x = obs.baseX + sin(frameCount * 0.05 + obs.offsetX) * 10;
      let y = obs.baseY + sin(frameCount * 0.07 + obs.offsetY) * 12;
      let size = 30;
      if (dist(playerX, playerY, x, y) < (playerSize + size) / 2) {
        boomSound.play(); gameOver = "loss";
      }
    }

    if (gameStarted && violationCooldown === 0) {
      lightTimer--;
      if (lightTimer <= 0) {
        randomLight();
      }
    }
  }

  let playerW = 120;
  let playerH = 75;
  image(playerPic, playerX - playerW / 2, playerY - playerH / 2, playerW, playerH);

  textSize(24); textAlign(CENTER, TOP);
  if (light === "green") {
    fill(0, 180, 0); text("GREEN LIGHT!", width / 2, 10);
  } else if (light === "red") {
    fill(180, 0, 0); text("RED LIGHT!", width / 2, 10);
  }

  if (gameOver === "loss") {
    if (!lostSound.isPlaying()) lostSound.play();
    duringSound.stop();
    textSize(48); fill(255, 0, 0);
    text("GAME OVER!", width / 2, height / 2);
    showRetryButton = true;
  } else if (gameOver === "win") {
    textSize(48); fill(0, 200, 0);
    text("YOU WIN!", width / 2, height / 2);
    showRetryButton = true;
  }

  fill(255, 165, 0);
  rect(0, height - 40, width, 40);

  if (!gameStarted) {
    fill(0); textSize(20); textAlign(CENTER, CENTER);
    text("CROSS THE PEACH ZONE TO START", width / 2, height - 20);
  }

  if (showRetryButton) {
    fill(30, 144, 255);
    rect(buttonX, buttonY, buttonW, buttonH, 8);
    fill(255);
    textSize(20); textAlign(CENTER, CENTER);
    text("Retry Game", buttonX + buttonW / 2, buttonY + buttonH / 2);
  }
}

function mousePressed() {
  if (
    showRetryButton &&
    mouseX > buttonX &&
    mouseX < buttonX + buttonW &&
    mouseY > buttonY &&
    mouseY < buttonY + buttonH
  ) {
    resetGame();
  }
}

function resetGame() {
  playerX = 30;
  playerY = height / 2 - 20;
  speed = 0;
  vSpeed = 0;
  light = "green";
  lightTimer = int(random(60, 180));
  gameOver = false;
  gameStarted = false;
  violationCooldown = 0;
  violationActive = false;
  startPlaying = false;
  duringPlaying = false;
  endPlaying = false;
  showRetryButton = false;

  setupObstacles();

  startSound.stop();
  duringSound.stop();
  endSound.stop();
  lostSound.stop();
}

function keyPressed() {
  if (!gameOver) {
    if (keyCode === RIGHT_ARROW) {
      speed = 2;
      if (
        gameStarted &&
        light === "red" &&
        playerX - playerSize / 2 > 100 &&
        violationCooldown === 0
      ) {
        violationActive = true;
        let progress = (playerX - 100) / (width - 180);
        violationCooldown = int(28 - progress * 16);
      }
    }
    if (keyCode === UP_ARROW) vSpeed = -2;
    if (keyCode === DOWN_ARROW) vSpeed = 2;
  }
}

function keyReleased() {
  if (keyCode === RIGHT_ARROW) {
    speed = 0;
    violationActive = false;
  }
  if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
    vSpeed = 0;
  }
}

function randomLight() {
  let randValue = random(1);
  if (randValue < 0.5) {
    light = "green";
    greenSound.play();
  } else {
    light = "red";
    redSound.play();
  }
  lightTimer = int(random(60, 180));
}