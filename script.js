// Configuración del canvas
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Ajustar tamaño del canvas según la pantalla
function resizeCanvas() {
    const maxWidth = Math.min(window.innerWidth - 40, 800);
    const maxHeight = window.innerHeight - 250;
    
    canvas.width = maxWidth;
    canvas.height = Math.min(maxHeight, maxWidth * 0.5);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Detectar si es móvil
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const controlText = document.getElementById('controlText');

if (isMobile) {
    controlText.textContent = '👆 Toca para controlar | Desliza hacia arriba/abajo';
}

// Variables del juego
const paddleHeight = canvas.height * 0.25;
const paddleWidth = 8;
const ballSize = 6;
const gameSpeed = 4;

let playerScore = 0;
let computerScore = 0;

// Objeto Paleta del Jugador
const player = {
    x: 15,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 5
};

// Objeto Paleta de la Computadora
const computer = {
    x: canvas.width - paddleWidth - 15,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 3.5
};

// Objeto Pelota
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: ballSize,
    dx: gameSpeed,
    dy: gameSpeed,
    speed: gameSpeed
};

// Control por teclado
const keys = {};
document.addEventListener('keydown', (e) => {
    console.log('Key pressed:', e.key);
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    console.log('Key released:', e.key);
    keys[e.key] = false;
});

// Control por ratón
let mouseY = null;
let lastMouseMove = 0;
document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
    lastMouseMove = Date.now();
});

// Control por táctil (para móviles)
let touchY = null;
let lastTouchMove = 0;
document.addEventListener('touchmove', (e) => {
    if (isMobile) {
        const rect = canvas.getBoundingClientRect();
        touchY = e.touches[0].clientY - rect.top;
        lastTouchMove = Date.now();
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchend', (e) => {
    if (isMobile) {
        touchY = null;
        lastTouchMove = 0;
    }
});

// Actualizar posición del jugador
function updatePlayerInput() {
    let targetY = player.y;
    
    const now = Date.now();
    const mouseInactive = !mouseY || (now - lastMouseMove > 500);
    const touchInactive = !touchY || (now - lastTouchMove > 500);
    
    // PRIMERO: Verificar teclado (flechas tienen prioridad sobre ratón/toque)
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        targetY = player.y - player.speed;
    } else if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        targetY = player.y + player.speed;
    } else {
        // SEGUNDO: Si no hay input de teclado, usar ratón o toque
        if (isMobile && touchY && !touchInactive) {
            // Móvil: usar toque si está activo
            targetY = touchY - paddleHeight / 2;
        } else if (!isMobile && mouseY && !mouseInactive) {
            // Desktop: usar ratón si está activo
            targetY = mouseY - paddleHeight / 2;
        }
    }
    
    // Limitar movimiento
    player.y = Math.max(0, Math.min(canvas.height - player.height, targetY));
}

// IA de la Computadora
function updateComputer() {
    const computerCenter = computer.y + computer.height / 2;
    const ballCenter = ball.y;
    const margin = 30;
    
    if (computerCenter < ballCenter - margin) {
        computer.y = Math.min(canvas.height - computer.height, computer.y + computer.speed);
    } else if (computerCenter > ballCenter + margin) {
        computer.y = Math.max(0, computer.y - computer.speed);
    }
}

// Actualizar posición de la pelota
function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Colisión con paredes superiores e inferiores
    if (ball.y - ball.size < 0 || ball.y + ball.size > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = ball.y - ball.size < 0 ? ball.size : canvas.height - ball.size;
    }
    
    // Colisión con paleta del jugador
    if (
        ball.x - ball.size < player.x + player.width &&
        ball.y > player.y &&
        ball.y < player.y + player.height
    ) {
        ball.dx = Math.abs(ball.dx);
        ball.x = player.x + player.width + ball.size;
        
        const hitPos = (ball.y - (player.y + player.height / 2)) / (player.height / 2);
        ball.dy = hitPos * ball.speed;
    }
    
    // Colisión con paleta de la computadora
    if (
        ball.x + ball.size > computer.x &&
        ball.y > computer.y &&
        ball.y < computer.y + computer.height
    ) {
        ball.dx = -Math.abs(ball.dx);
        ball.x = computer.x - ball.size;
        
        const hitPos = (ball.y - (computer.y + computer.height / 2)) / (computer.height / 2);
        ball.dy = hitPos * ball.speed;
    }
    
    // Punto para la computadora
    if (ball.x < 0) {
        computerScore++;
        resetBall();
    }
    
    // Punto para el jugador
    if (ball.x > canvas.width) {
        playerScore++;
        resetBall();
    }
}

// Reiniciar la pelota
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * gameSpeed;
    ball.dy = (Math.random() - 0.5) * gameSpeed;
}

// Dibujar funciones
function drawPaddle(paddle) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ball.x - ball.size, ball.y - ball.size, ball.size * 2, ball.size * 2);
}

function drawDottedLine() {
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function draw() {
    // Limpiar canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar línea punteada central
    drawDottedLine();
    
    // Dibujar elementos
    drawPaddle(player);
    drawPaddle(computer);
    drawBall();
}

// Actualizar puntuación
function updateScore() {
    document.getElementById('playerScore').textContent = playerScore;
    document.getElementById('computerScore').textContent = computerScore;
}

// Loop principal del juego
function gameLoop() {
    updatePlayerInput();
    updateComputer();
    updateBall();
    draw();
    updateScore();
    
    requestAnimationFrame(gameLoop);
}

// Iniciar el juego
gameLoop();
