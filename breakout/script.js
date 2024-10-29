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

//timer vars
let ballStartTimer = null;
let countdown = 3;
let countdownInterval = null;


//paddle vars
let paddleHeight = 15;
let paddleWidth = 60;
let paddleX = (canvas.width - paddleWidth) /2;  //starting x coord (centered)
let paddleY = (canvas.height - paddleHeight - 100);

//ball vars
let ballRadius = 6;
let x = canvas.width /2;    //starting x coord 
let y = canvas.height - 250; //starting y coord
let maxSpeed = 5;
let dx = 0;      //x vel
let dy = (maxSpeed); //y vel

//keyboard control vars
let rightPressed = false;
let leftPressed = false;

//brick vars
let totalBricks = 0;
let brickRowCount = 10;
let brickColumnCount = 12;
let brickWidth = 55;
let brickHeight = 15;
let brickPadding = 5;      //space between bricks
let brickOffsetTop = 50;    //top offset for brick grid
let brickOffsetLeft = 40;   //left offset for brick grid

//score and lives
let bricksHit = 0;
let score = 0;
let lives = 3;
let extraLives = [];
let gameOver = false;

//bricks array
let bricks = [];

//intialize bricks array to have x, y, and health flags for each brick
//health 0 - brick invisible
//health 1 - visible, one hit to break
//health 2 - visible, two hit to break

//event listeners for key presses/releases
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
nextLevelButton.addEventListener('click', startLevel);
document.addEventListener('keydown', keyDownHandler, false); //triggered when key is pressed down
document.addEventListener('keyup', keyUpHandler, false);     //triggered when key is released
canvas.addEventListener('mousemove', mouseMoveHandler, false); //mouse movement tracker

document.fonts.load('700 48px "Silkscreen"').then(() => {
    fontReady = true;
});

function keyDownHandler(e) {
    if(e.key == 'Right' || e.key == 'ArrowRight') {
        rightPressed = true;
    }
    else if (e.key == 'Left' || e.key == 'ArrowLeft') {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if(e.key == 'Right' || e.key == 'ArrowRight') {
        rightPressed = false;
    }
    else if (e.key == 'Left' || e.key == 'ArrowLeft') {
        leftPressed = false;
    }
}

function mouseMoveHandler(e) {
    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;  // scaling factor for x
    let scaleY = canvas.height / rect.height; // scaling factor for y

    // Calculate mouse position within the canvas
    let mouseX = (e.clientX - rect.left) * scaleX;
    let mouseY = (e.clientY - rect.top) * scaleY;

    // Adjust paddle position based on mouse
    if (mouseX - paddleWidth / 2 > 0 && mouseX + paddleWidth / 2 < canvas.width) {
        paddleX = mouseX - paddleWidth / 2;
    } else if (mouseX - paddleWidth / 2 <= 0) {
        paddleX = 0;
    } else if (mouseX + paddleWidth / 2 >= canvas.width) {
        paddleX = canvas.width - paddleWidth;
    }
}

function displayCountdown() {
    if(countdownInterval) {
        clearInterval(countdownInterval);
    }
    countdownInterval = setInterval(() => {
        if(countdown > 1) {
            countdown--;
        } else {
            clearInterval(countdownInterval);
            countdownInterval = null;
            countdown = null; //stop displaying countdown
            dy = -maxSpeed;
            dx = 0;
        }
    }, 1000); //update every second
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2); //draw circle at (x,y) with radius ballRadius
    ctx. fillStyle = '#ffffff';
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, paddleY, paddleWidth, paddleHeight); //draw rectangle for paddle
    let gradient = ctx.createLinearGradient(paddleX, paddleY, paddleX, paddleY + paddleHeight);
    gradient.addColorStop(0, '#4b4b4b');
    gradient.addColorStop(1, '#a3a3a3');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
    ctx.closePath();
}

//function for rounded edges on bricks
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

    //set shadow properties
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if(b.health > 0) {
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                b.x = brickX;
                b.y = brickY;

                //create gradient based on health
                let gradient;
                if(b.health == 1) {
                    gradient = ctx.createLinearGradient(brickX, brickY, brickX, brickY + brickHeight);
                    gradient.addColorStop(0, '#0c14c6');
                    gradient.addColorStop(1, '#21bcff');
                } else if(b.health == 2) {
                    gradient = ctx.createLinearGradient(brickX, brickY, brickX, brickY + brickHeight);
                    gradient.addColorStop(0, '#c61818');
                    gradient.addColorStop(1, '#ff2020');
                }

                //draw the brick
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
    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r]; //curr brick
            if(b.health > 0) {
                //calc sides of brick
                let brickLeft = b.x;
                let brickRight = b.x + brickWidth;
                let brickTop = b.y;
                let brickBottom = b.y + brickHeight;

                //check if ball pos overlaps with brick pos
                if(x + ballRadius > brickLeft && x - ballRadius < brickRight && y + ballRadius > brickTop && y - ballRadius < brickBottom) {
                    //determine collision side and reverse ball direction
                    if(x < brickLeft || x > brickRight) {
                        dx = -dx
                    } else {
                        dy = -dy; 
                    }
                    if(b.health > 0) {
                        b.health--; //health decrement
                        if(b.health == 0) {
                            bricksHit++;
                            score+=10;
                        }
                    }
                    if(bricksHit == totalBricks) {
                        levelPass = true;
                    }
                }

            }
        }
    }
}

function extraLifeCollisionDetection() {
    for (let i = 0; i < extraLives.length; i++) {
        let life = extraLives[i];
        if (!life.collected) {
            //calc distance between ball and extra life
            let distX = x - life.x;
            let distY = y - life.y;
            let distance = Math.sqrt(distX * distX + distY * distY);

            //check for collision
            if(distance < ballRadius + life.radius) {
                //collision detected
                life.collected = true;
                lives++;
            }
        }
    }
}


//score counter top left
function drawScore() {
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Score: ' + score, 35, 20); 
}

//lives counter top right
function drawLives() {
    const heartWidth = 25;
    const heartHeight = 20;
    const spacing = 5;
    const startX = canvas.width - (heartWidth + spacing) * lives - 35;
    const yPosition = 10;

    for(let i = 0; i <lives; i++) {
        ctx.drawImage(heartImage, startX + i * (heartWidth + spacing), yPosition, heartWidth, heartHeight);
    }
}

function drawExtraLives() {
    for (let i = 0; i < extraLives.length; i++) {
        let life = extraLives[i];
        if(!life.collected) {
            ctx.beginPath();
            ctx.arc(life.x, life.y, life.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ffcccc'; // Light red color
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ff0000'; // Red border
            ctx.stroke();
            ctx.closePath();
            

            //draw heart image at center

            let heartWidth = life.radius * 1.2;
            let heartHeight = life.radius * 1.2;
            ctx.drawImage( 
                heartImage,
                life.x - heartWidth/2,
                life.y - heartHeight/2,
                heartWidth,
                heartHeight
            );
        }
    }
}

function drawGameOver() {
    if (!fontReady) {
        //if font not ready, wait and try again
        setTimeout(drawGameOver, 100);
        return;
    }

    clearCanvas();

    //set font properties
    ctx.font = 'bold 48px "Silkscreen", sans-serif';
    ctx.fillStyle = '#FF0000'; //red
    ctx.textAlign = 'center';

    //draw 'GAME OVER' text
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);

    //maybe include final score or something else here
}

function drawYouWin() {
    if (!fontReady) {
        setTimeout(drawYouWin, 100);
        return;
    }

    clearCanvas();

    //set font properties
    ctx.font = '48px "Silkscreen", sans-serif';
    ctx.fillStyle = '#20d10a'; //bright green

    //draw 'YOU WIN' text

    ctx.fillText('YOU WIN', canvas.width/2, 250);
}

function drawLevelPass() {
    if (!fontReady) {
        setTimeout(drawLevelPass, 100);
        return;
    }

    clearCanvas();

    //set font properties
    ctx.font = '48px "Silkscreen", sans-serif';
    ctx.fillStyle = '#208cff'; //light blue

    //draw 'LEVEL PASS' text

    ctx.fillText('LEVEL PASS', canvas.width/2, 250);
}

//clear screen
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function draw() {
    clearCanvas();

    if(!gameRunning) {
        //maybe add a title screen here later
        if(gameOver) {
            drawGameOver();
            return;
        }
        else if(levelPass) {
            if(level >= 3) {
                drawYouWin();
            }
            else {
                drawLevelPass();
            }
            return;
        }
        return;
    }

    //draw game elements
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

    //handle game logic
    collisionDetection();
    extraLifeCollisionDetection();

    if (levelPass == true) {
        level++;
        if (level == 2) { //move to next level
            nextLevelButton.style.display = 'unset';
            drawLevelPass();
        }
        gameRunning = false;
        if(ballStartTimer) {
            clearTimeout(ballStartTimer);
            ballStartTimer = null;
        }
        if(countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        if (level == 3) { //all levels complete
            startButton.style.display = 'unset';
            drawYouWin();
        }
        return;
    }

    //update ball pos
    x += dx;
    y += dy;

    //calc paddle edges
    let paddleTop = paddleY;
    let paddleBottom = paddleY + paddleHeight;
    let paddleLeft = paddleX;
    let paddleRight = paddleX + paddleWidth;

    //bounce ball of left and right walls
    if(x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }

    if(y < 0 + ballRadius) {
        dy = -dy
    }

    //check for collision w/ paddle
    if (y + dy < paddleY) {
        dy = dy;
    } else if(y + dy > canvas.height - ballRadius - paddleY) {
    
        if(y + ballRadius >= paddleTop && y + ballRadius <= paddleBottom && x + ballRadius > paddleLeft && x - ballRadius < paddleRight) {
            dy = -Math.abs(dy); //bounce off paddle
            //calc hit pos relative to center of paddle
            let relativeHitPos = (x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2); 
            
            dx = relativeHitPos * maxSpeed;
            
            //ball missed paddle
            } else if(y > canvas.height + 100){
                lives--;
                if(!lives) {
                    //game over condition
                    gameOver = true;
                    gameRunning = false;
                    restartButton.style.display = 'unset';
                    //clear any timers
                    if(ballStartTimer) {
                        clearTimeout(ballStartTimer);
                        ballStartTimer = null;
                    }
                    if(countdownInterval) {
                        clearInterval(countdownInterval);
                        countdownInterval = null;
                    }

                    drawGameOver();

                    return;

                    
                } else{
                    //reset ball and paddle pos
                    x = canvas.width/2; y = canvas.height-250;
                    dx = 0;
                    dy = 0;
                    paddleX = (canvas.width - paddleWidth) / 2;

                    countdown = 3;
                    displayCountdown();

                    //clear any existing timer
                    if(ballStartTimer) {
                        clearTimeout(ballStartTimer);
                    }
                    //ball starts moving 3 seconds after start
                    ballStartTimer = setTimeout(() => { //setTimeout delays function 3000ms
                        dy = maxSpeed;
                        dx = Math.random(); //set start x vel to range between -.5 and .5
                        if(Math.random() > 0.5) 
                            dx = -dx
                        ballStartTimer = null;
                    }, 3000);
                }
            }
    }

    //move paddle based on input
    if(rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7; //move paddle right
    } else if(leftPressed && paddleX > 0) {
        paddleX -= 7; //move paddle left
    }

    if(gameRunning) {
        //request next frame
        requestAnimationFrame(draw);
    } else if(gameOver) {
        //draw game over screen
        drawGameOver();
    } 

}

function resetGame() {
    gameRunning = false;
    levelPass = false;
    gameOver = false;
    bricksHit = 0;
    totalBricks = 0;
    bricks = [];
    extraLives = [];


    x = canvas.width /2;
    y = canvas.height - 250;
    dx = 0;
    dy = 0;

    paddleX = (canvas.width - paddleWidth) / 2;

    totalBricks = 0;

    for(let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for(let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, health: 0}; //initialize all bricks w/ health 0

            if(level == 1 && r < 7) {
                //level 1, bricks in r 0-6 health 1
                bricks[c][r].health = 1;
                totalBricks++;
            }
            else if(level == 2) {
                //level 2, start with health 1
                bricks[c][r].health = 1;
                totalBricks++;
            }
        }
    }

    //level specific modification
    if(level == 2) {
        //holes in brick grid
        let holes = [ [1,2], [1,3], [2,2], [2,3], [3,2], [3,3], [8,2], [8,3], [9,2], [9,3], [10,2], [10,3] ];
        for(let [c, r] of holes) {
            if(bricks[c][r].health > 0) {
                bricks[c][r].health = 0;
                totalBricks--
            }
        }

        //set two hit bricks
        let twoHitBricks = [ [5,2], [5,3], [6,2], [6,3] ];
        for(let [c, r] of twoHitBricks) {
            if (bricks[c][r].health > 0) {
                bricks[c][r].health = 2;
            }
        }

        //bottom row health 2
        for(let i = 0; i < brickColumnCount; i++) {
            if (bricks[i][9].health > 0) {
                bricks[i][9].health = 2;
            }
        }

        let extraLifePositions = [
            { c: 2, rStart: 2, rEnd: 3 }, // First extra life between rows 2 and 3
            { c: 9, rStart: 2, rEnd: 3 }  // Second extra life between rows 2 and 3
        ];

        for (let pos of extraLifePositions) {
            let c = pos.c;
            let rStart = pos.rStart;
            let rEnd = pos.rEnd;
        
            // Calculate horizontal position (same as before)
            let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
            let brickCenterX = brickX + brickWidth / 2;
        
            // Calculate vertical position to be centered between rStart and rEnd
            let brickYStart = (rStart * (brickHeight + brickPadding)) + brickOffsetTop;
            let brickYEnd = ((rEnd * (brickHeight + brickPadding)) + brickOffsetTop) + brickHeight;
            let brickCenterY = (brickYStart + brickYEnd) / 2;
        
            // Add extra life pickup at the center of the hole
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
    draw();

    countdown = 3;
    displayCountdown();

    //clear any existing timer
    if(ballStartTimer) {
        clearTimeout(ballStartTimer);
    }
    //ball starts moving 3 seconds after start
    ballStartTimer = setTimeout(() => { 
        dy = maxSpeed;
        dx = Math.random();
        if(Math.random() > 0.5)
            dx = -dx
        ballStartTimer = null;
    }, 3000);
}

//start or restart game
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
    draw();

    countdown = 3;
    displayCountdown();

    //clear any existing timer
    if(ballStartTimer) {
        clearTimeout(ballStartTimer);
    }
    //ball starts moving 3 seconds after start
    ballStartTimer = setTimeout(() => { 
        dy = maxSpeed;
        dx = Math.random();
        if(Math.random() > 0.5)
            dx = -dx
        ballStartTimer = null;
    }, 3000);
}