document.addEventListener('DOMContentLoaded', () => {
    const bird = document.getElementById('bird');
    const gameContainer = document.querySelector('.game-container');
    const sky = document.querySelector('.sky');
    const scoreDisplay = document.getElementById('score');
    const message = document.getElementById('message');
    const gameOver = document.getElementById('game-over');
    const finalScore = document.getElementById('final-score');
    const highScoreDisplay = document.getElementById('high-score');
    const restartButton = document.getElementById('restart-button');

    let birdBottom = 300;
    let birdLeft = 60;
    let gravity = 2;
    let isGameOver = false;
    let gap = 200;
    let score = 0;
    let highScore = localStorage.getItem('flappyHighScore') || 0;
    let gameStarted = false;
    let gameInterval;

    highScoreDisplay.textContent = highScore;

    function startGame() {
        if (gameStarted) return;
        gameStarted = true;
        message.classList.add('hidden');
        birdBottom = 300;
        bird.style.bottom = birdBottom + 'px';
        score = 0;
        scoreDisplay.textContent = score;
        isGameOver = false;
        gameOver.classList.add('hidden');

        gameInterval = setInterval(gameLoop, 20);
        generatePipes();
    }

    function gameLoop() {
        updateBirdPosition();
        checkCollisions();
    }

    function updateBirdPosition() {
        birdBottom -= gravity;
        bird.style.bottom = birdBottom + 'px';
    }

    function jump() {
        if (birdBottom + 50 < sky.clientHeight) {
            birdBottom += 50;
            bird.style.bottom = birdBottom + 'px';
        }
    }

    function generatePipes() {
        if (isGameOver) return;

        const pipeDelay = 1500;
        
        let pipeLeft = gameContainer.clientWidth;
        let pipeHeight = Math.floor(Math.random() * 200) + 100;
        
        // Create top pipe
        const topPipe = document.createElement('div');
        topPipe.classList.add('pipe', 'pipe-top');
        topPipe.style.left = pipeLeft + 'px';
        topPipe.style.height = pipeHeight + 'px';
        sky.appendChild(topPipe);
        
        // Create bottom pipe
        const bottomPipe = document.createElement('div');
        bottomPipe.classList.add('pipe', 'pipe-bottom');
        bottomPipe.style.left = pipeLeft + 'px';
        bottomPipe.style.height = sky.clientHeight - pipeHeight - gap + 'px';
        sky.appendChild(bottomPipe);
        
        function movePipes() {
            if (isGameOver) {
                clearInterval(pipeInterval);
                return;
            }
            
            pipeLeft -= 2;
            topPipe.style.left = pipeLeft + 'px';
            bottomPipe.style.left = pipeLeft + 'px';
            
            // Check if pipe has passed bird position
            if (pipeLeft + 60 === birdLeft) {
                score++;
                scoreDisplay.textContent = score;
            }
            
            // Remove pipes when they go off-screen
            if (pipeLeft < -60) {
                clearInterval(pipeInterval);
                sky.removeChild(topPipe);
                sky.removeChild(bottomPipe);
            }
        }
        
        let pipeInterval = setInterval(movePipes, 20);
        if (!isGameOver) setTimeout(generatePipes, pipeDelay);
    }

    function checkCollisions() {
        const birdRect = bird.getBoundingClientRect();
        const pipes = document.querySelectorAll('.pipe');
        const groundRect = document.querySelector('.ground').getBoundingClientRect();
        
        // Check for ground collision
        if (birdRect.bottom >= groundRect.top) {
            endGame();
            return;
        }
        
        // Check for ceiling collision
        if (birdRect.top <= 0) {
            endGame();
            return;
        }
        
        // Check for pipe collisions
        for (let pipe of pipes) {
            const pipeRect = pipe.getBoundingClientRect();
            
            if (
                birdRect.right > pipeRect.left &&
                birdRect.left < pipeRect.right &&
                birdRect.bottom > pipeRect.top &&
                birdRect.top < pipeRect.bottom
            ) {
                endGame();
                return;
            }
        }
    }

    function endGame() {
        isGameOver = true;
        gameStarted = false;
        clearInterval(gameInterval);
        
        // Update high score if needed
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('flappyHighScore', highScore);
            highScoreDisplay.textContent = highScore;
        }
        
        finalScore.textContent = score;
        gameOver.classList.remove('hidden');
    }

    // Event listeners
    document.addEventListener('keydown', event => {
        if (event.code === 'Space') {
            if (!gameStarted && !isGameOver) {
                startGame();
            }
            if (gameStarted && !isGameOver) {
                jump();
            }
        }
    });

    gameContainer.addEventListener('click', () => {
        if (!gameStarted && !isGameOver) {
            startGame();
        }
        if (gameStarted && !isGameOver) {
            jump();
        }
    });

    restartButton.addEventListener('click', startGame);
}); 