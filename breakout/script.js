const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const nextLevelButton = document.getElementById('nextLevelButton');
const heartImage = new Image();
heartImage.src = 'heart.png';
nextLevelButton.style.display = 'none';
restartButton.style.display = 'none';
let gameRunning = false;
let levelPass = false;
let beatGame = false;
let level = 1;

let fontReady = false;

// ---- timing & speeds (uniform across systems) ----
const BALL_SPEED = 400;     // px/s  (tune)
const PADDLE_SPEED = 520;   // px/s  (tune)
let lastTime = performance.now();
let ballStartTimer = null;
let countdown = 3;
let countdownInterval = null;

// ---- paddle ----
let paddleHeight = 15;
let paddleWidth = 60;
let paddleX = (canvas.width - paddleWidth) / 2;
let paddleY = (canvas.height - paddleHeight - 100);

// ---- ball ----
let ballRadius = 6;
let x = canvas.width / 2;
let y = canvas.height - 250;
// velocities are pixels/second now:
let vx = 0;
let vy = 0;

// ---- input ----
let rightPressed = false;
let leftPressed = false;

// ---- bricks ----
let totalBricks = 0;
let brickRowCount = 10;
let brickColumnCount = 12;
let brickWidth = 55;
let brickHeight = 15;
let brickPadding = 5;
let brickOffsetTop = 50;
let brickOffsetLeft = 40;

// ---- score & lives ----
let bricksHit = 0;
let score = 0;
let lives = 3;
let extraLives = [];
let gameOver = false;

// ---- data ----
let bricks = [];

// events
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
nextLevelButton.addEventListener('click', startLevel);
document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);
canvas.addEventListener('mousemove', mouseMoveHandler, false);

document.fonts.load('700 48px "Silkscreen"').then(() => {
  fontReady = true;
});

function keyDownHandler(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight') {
    rightPressed = true;
  } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
    leftPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight') {
    rightPressed = false;
  } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
    leftPressed = false;
  }
}

function mouseMoveHandler(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const mouseX = (e.clientX - rect.left) * scaleX;

  if (mouseX - paddleWidth / 2 > 0 && mouseX + paddleWidth / 2 < canvas.width) {
    paddleX = mouseX - paddleWidth / 2;
  } else if (mouseX - paddleWidth / 2 <= 0) {
    paddleX = 0;
  } else if (mouseX + paddleWidth / 2 >= canvas.width) {
    paddleX = canvas.width - paddleWidth;
  }
}

function displayCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdown = 3;
  countdownInterval = setInterval(() => {
    if (countdown > 1) {
      countdown--;
    } else {
      clearInterval(countdownInterval);
      countdownInterval = null;
      countdown = null; // stop displaying numbers
      // (launch happens in ballStartTimer)
    }
  }, 1000);
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, paddleY, paddleWidth, paddleHeight);
  const gradient = ctx.createLinearGradient(paddleX, paddleY, paddleX, paddleY + paddleHeight);
  gradient.addColorStop(0, '#4b4b4b');
  gradient.addColorStop(1, '#a3a3a3');
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000000';
  ctx.stroke();
  ctx.closePath();
}

function drawRoundedBrick(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawBricks() {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.health > 0) {
        const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
        const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
        b.x = brickX;
        b.y = brickY;

        let gradient;
        if (b.health === 1) {
          gradient = ctx.createLinearGradient(brickX, brickY, brickX, brickY + brickHeight);
          gradient.addColorStop(0, '#0c14c6');
          gradient.addColorStop(1, '#21bcff');
        } else if (b.health === 2) {
          gradient = ctx.createLinearGradient(brickX, brickY, brickX, brickY + brickHeight);
          gradient.addColorStop(0, '#c61818');
          gradient.addColorStop(1, '#ff2020');
        }

        drawRoundedBrick(brickX, brickY, brickWidth, brickHeight, 5);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function collisionDetection() {
  // circle-AABB overlap; flip axis of smallest penetration
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.health <= 0) continue;

      const left = b.x;
      const right = b.x + brickWidth;
      const top = b.y;
      const bottom = b.y + brickHeight;

      const overlapX = (x + ballRadius > left) && (x - ballRadius < right);
      const overlapY = (y + ballRadius > top) && (y - ballRadius < bottom);

      if (overlapX && overlapY) {
        // compute penetration depths
        const penLeft = right - (x - ballRadius);
        const penRight = (x + ballRadius) - left;
        const penTop = bottom - (y - ballRadius);
        const penBottom = (y + ballRadius) - top;

        const minPen = Math.min(penLeft, penRight, penTop, penBottom);

        if (minPen === penLeft || minPen === penRight) {
          vx = -vx;
        } else {
          vy = -vy;
        }

        if (b.health > 0) {
          b.health--;
          if (b.health === 0) {
            bricksHit++;
            score += 10;
            if (bricksHit === totalBricks) {
              levelPass = true;
            }
          }
        }
      }
    }
  }
}

function extraLifeCollisionDetection() {
  for (let i = 0; i < extraLives.length; i++) {
    const life = extraLives[i];
    if (!life.collected) {
      const distX = x - life.x;
      const distY = y - life.y;
      const distance = Math.hypot(distX, distY);
      if (distance < ballRadius + life.radius) {
        life.collected = true;
        lives++;
      }
    }
  }
}

function drawScore() {
  ctx.font = '16px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Score: ' + score, 55, 20);
}

function drawLives() {
  const heartWidth = 25;
  const heartHeight = 20;
  const spacing = 5;
  const startX = canvas.width - (heartWidth + spacing) * lives - 35;
  const yPosition = 10;

  for (let i = 0; i < lives; i++) {
    ctx.drawImage(heartImage, startX + i * (heartWidth + spacing), yPosition, heartWidth, heartHeight);
  }
}

function drawExtraLives() {
  for (let i = 0; i < extraLives.length; i++) {
    const life = extraLives[i];
    if (!life.collected) {
      ctx.beginPath();
      ctx.arc(life.x, life.y, life.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffcccc';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ff0000';
      ctx.stroke();
      ctx.closePath();

      const heartWidth = life.radius * 1.2;
      const heartHeight = life.radius * 1.2;
      ctx.drawImage(
        heartImage,
        life.x - heartWidth / 2,
        life.y - heartHeight / 2,
        heartWidth,
        heartHeight
      );
    }
  }
}

function drawGameOver() {
  if (!fontReady) { setTimeout(drawGameOver, 100); return; }
  clearCanvas();
  ctx.font = 'bold 48px "Silkscreen", sans-serif';
  ctx.fillStyle = '#FF0000';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
}

function drawYouWin() {
  if (!fontReady) { setTimeout(drawYouWin, 100); return; }
  clearCanvas();
  ctx.font = '48px "Silkscreen", sans-serif';
  ctx.fillStyle = '#20d10a';
  ctx.textAlign = 'center';
  ctx.fillText('YOU WIN', canvas.width / 2, 250);
}

function drawLevelPass() {
  if (!fontReady) { setTimeout(drawLevelPass, 100); return; }
  clearCanvas();
  ctx.font = '48px "Silkscreen", sans-serif';
  ctx.fillStyle = '#208cff';
  ctx.textAlign = 'center';
  ctx.fillText('LEVEL PASS', canvas.width / 2, 250);
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ---- main loop (time-based) ----
function draw(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000); // clamp big jumps (tab switch, etc.)
  lastTime = now;

  clearCanvas();

  if (!gameRunning) {
    if (gameOver) { drawGameOver(); return; }
    else if (levelPass) { level >= 3 ? drawYouWin() : drawLevelPass(); return; }
    return;
  }

  // draw
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  drawLives();
  drawExtraLives();

  if (countdown !== null) {
    ctx.font = '48px Arial';
    ctx.fillStyle = '#0095DD';
    ctx.textAlign = 'center';
    ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
  }

  // logic
  collisionDetection();
  extraLifeCollisionDetection();

  if (levelPass === true) {
    level++;
    if (level === 2) {
      nextLevelButton.style.display = 'unset';
      drawLevelPass();
    }
    gameRunning = false;

    if (ballStartTimer) { clearTimeout(ballStartTimer); ballStartTimer = null; }
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }

    if (level === 3) {
      startButton.style.display = 'unset';
      drawYouWin();
    }
    return;
  }

  // move paddle (keyboard) with dt
  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX = Math.min(canvas.width - paddleWidth, paddleX + PADDLE_SPEED * dt);
  } else if (leftPressed && paddleX > 0) {
    paddleX = Math.max(0, paddleX - PADDLE_SPEED * dt);
  }

  // propose next ball position
  let nx = x + vx * dt;
  let ny = y + vy * dt;

  // wall bounces
  if (nx > canvas.width - ballRadius) { nx = canvas.width - ballRadius; vx = -vx; }
  if (nx < ballRadius)                { nx = ballRadius;                vx = -vx; }
  if (ny < ballRadius)                { ny = ballRadius;                vy = -vy; }

  // paddle collision (only when moving downward)
  const paddleTop = paddleY;
  const paddleBottom = paddleY + paddleHeight;
  const paddleLeft = paddleX;
  const paddleRight = paddleX + paddleWidth;

  const willHitPaddle =
    vy > 0 &&
    ny + ballRadius >= paddleTop &&
    ny - ballRadius <= paddleBottom &&
    nx + ballRadius > paddleLeft &&
    nx - ballRadius < paddleRight;

  if (willHitPaddle) {
    ny = paddleTop - ballRadius;
    vy = -Math.abs(vy);

    const relativeHit = (nx - (paddleX + paddleWidth / 2)) / (paddleWidth / 2); // -1..1
    vx = relativeHit * BALL_SPEED;

    // normalize to constant speed
    const speed = Math.hypot(vx, vy);
    if (speed > 0) {
      const k = BALL_SPEED / speed;
      vx *= k; vy *= k;
    }
  }

  // commit movement
  x = nx; y = ny;

  // missed paddle / life lost
  if (y - ballRadius > canvas.height + 100) {
    lives--;
    if (!lives) {
      gameOver = true;
      gameRunning = false;
      restartButton.style.display = 'unset';

      if (ballStartTimer) { clearTimeout(ballStartTimer); ballStartTimer = null; }
      if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }

      drawGameOver();
      return;
    } else {
      // reset ball & paddle
      x = canvas.width / 2; y = canvas.height - 250;
      vx = 0; vy = 0;
      paddleX = (canvas.width - paddleWidth) / 2;

      displayCountdown();

      if (ballStartTimer) clearTimeout(ballStartTimer);
      ballStartTimer = setTimeout(() => {
        vy = BALL_SPEED;
        vx = (Math.random() - 0.5) * 0.6 * BALL_SPEED;
        if (Math.random() > 0.5) vx = -vx;
        ballStartTimer = null;
      }, 3000);
    }
  }

  if (gameRunning) requestAnimationFrame(draw);
  else if (gameOver) drawGameOver();
}

function resetGame() {
  gameRunning = false;
  levelPass = false;
  gameOver = false;
  bricksHit = 0;
  totalBricks = 0;
  bricks = [];
  extraLives = [];

  x = canvas.width / 2;
  y = canvas.height - 250;
  vx = 0; vy = 0;
  paddleX = (canvas.width - paddleWidth) / 2;

  totalBricks = 0;

  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, health: 0 };

      if (level === 1 && r < 7) {
        bricks[c][r].health = 1;
        totalBricks++;
      } else if (level === 2) {
        bricks[c][r].health = 1;
        totalBricks++;
      }
    }
  }

  if (level === 2) {
    const holes = [[1,2],[1,3],[2,2],[2,3],[3,2],[3,3],[8,2],[8,3],[9,2],[9,3],[10,2],[10,3]];
    for (const [cc, rr] of holes) {
      if (bricks[cc][rr].health > 0) {
        bricks[cc][rr].health = 0;
        totalBricks--;
      }
    }

    const twoHitBricks = [[5,2],[5,3],[6,2],[6,3]];
    for (const [cc, rr] of twoHitBricks) {
      if (bricks[cc][rr].health > 0) {
        bricks[cc][rr].health = 2;
      }
    }

    for (let i = 0; i < brickColumnCount; i++) {
      if (bricks[i][9].health > 0) {
        bricks[i][9].health = 2;
      }
    }

    const extraLifePositions = [
      { c: 2, rStart: 2, rEnd: 3 },
      { c: 9, rStart: 2, rEnd: 3 }
    ];

    for (const pos of extraLifePositions) {
      const c = pos.c;
      const rStart = pos.rStart;
      const rEnd = pos.rEnd;

      const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
      const brickCenterX = brickX + brickWidth / 2;

      const brickYStart = (rStart * (brickHeight + brickPadding)) + brickOffsetTop;
      const brickYEnd = ((rEnd * (brickHeight + brickPadding)) + brickOffsetTop) + brickHeight;
      const brickCenterY = (brickYStart + brickYEnd) / 2;

      extraLives.push({ x: brickCenterX, y: brickCenterY, radius: 10, collected: false });
    }
  }

  clearCanvas();
}

function startLevel() {
  startButton.style.display = 'none';
  restartButton.style.display = 'none';
  nextLevelButton.style.display = 'none';
  resetGame();
  gameRunning = true;
  gameOver = false;
  levelPass = false;

  lastTime = performance.now();
  requestAnimationFrame(draw);

  displayCountdown();

  if (ballStartTimer) clearTimeout(ballStartTimer);
  ballStartTimer = setTimeout(() => {
    vy = BALL_SPEED;
    vx = (Math.random() - 0.5) * 0.6 * BALL_SPEED;
    if (Math.random() > 0.5) vx = -vx;
    ballStartTimer = null;
  }, 3000);
}

function startGame() {
  clearCanvas();
  level = 1;
  lives = 3;
  score = 0;
  bricksHit = 0;
  startButton.style.display = 'none';
  restartButton.style.display = 'none';
  nextLevelButton.style.display = 'none';
  resetGame();
  gameRunning = true;
  gameOver = false;
  levelPass = false;

  lastTime = performance.now();
  requestAnimationFrame(draw);

  displayCountdown();

  if (ballStartTimer) clearTimeout(ballStartTimer);
  ballStartTimer = setTimeout(() => {
    vy = BALL_SPEED;
    vx = (Math.random() - 0.5) * 0.6 * BALL_SPEED;
    if (Math.random() > 0.5) vx = -vx;
    ballStartTimer = null;
  }, 3000);
}
