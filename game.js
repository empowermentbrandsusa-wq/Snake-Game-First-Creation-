"use strict";

const canvas = document.querySelector("#gameBoard");
const context = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#bestScore");
const startOverlay = document.querySelector("#startOverlay");
const gameOverOverlay = document.querySelector("#gameOverOverlay");
const finalScoreElement = document.querySelector("#finalScore");
const resultMessage = document.querySelector("#resultMessage");
const soundButton = document.querySelector("#soundButton");

const gridSize = 20;
const cellSize = canvas.width / gridSize;
const speed = 115;
const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

let snake;
let food;
let direction;
let queuedDirection;
let score;
let bestScore = Number(localStorage.getItem("pocketSnakeBest")) || 0;
let timer;
let playing = false;
let soundEnabled = true;
let touchStart = null;

function formatScore(value) {
  return String(value).padStart(3, "0");
}

function resetState() {
  snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
  direction = directions.right;
  queuedDirection = directions.right;
  score = 0;
  food = makeFood();
  updateScores();
  draw();
}

function makeFood() {
  let next;
  do {
    next = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
  } while (snake?.some(part => part.x === next.x && part.y === next.y));
  return next;
}

function updateScores() {
  scoreElement.textContent = formatScore(score);
  bestScoreElement.textContent = formatScore(bestScore);
}

function startGame() {
  clearInterval(timer);
  resetState();
  playing = true;
  startOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  timer = setInterval(step, speed);
}

function step() {
  direction = queuedDirection;
  const head = snake[0];
  const nextHead = { x: head.x + direction.x, y: head.y + direction.y };
  const hitWall = nextHead.x < 0 || nextHead.x >= gridSize || nextHead.y < 0 || nextHead.y >= gridSize;
  const eating = nextHead.x === food.x && nextHead.y === food.y;
  const bodyToCheck = eating ? snake : snake.slice(0, -1);
  const hitSelf = bodyToCheck.some(part => part.x === nextHead.x && part.y === nextHead.y);

  if (hitWall || hitSelf) {
    endGame();
    return;
  }

  snake.unshift(nextHead);
  if (eating) {
    score += 10;
    bestScore = Math.max(score, bestScore);
    localStorage.setItem("pocketSnakeBest", String(bestScore));
    food = makeFood();
    updateScores();
    tone(560, 0.06);
  } else {
    snake.pop();
  }
  draw();
}

function endGame() {
  playing = false;
  clearInterval(timer);
  finalScoreElement.textContent = `Score ${formatScore(score)}`;
  resultMessage.textContent = score >= bestScore && score > 0 ? "A new personal best!" : "That was a good run.";
  gameOverOverlay.classList.remove("hidden");
  tone(135, 0.2);
}

function changeDirection(name) {
  if (!playing) return;
  const next = directions[name];
  if (next.x + direction.x === 0 && next.y + direction.y === 0) return;
  queuedDirection = next;
}

function roundedCell(x, y, inset, radius) {
  context.beginPath();
  context.roundRect(x * cellSize + inset, y * cellSize + inset, cellSize - inset * 2, cellSize - inset * 2, radius);
}

function draw() {
  context.fillStyle = "#112019";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(185, 242, 91, 0.055)";
  context.lineWidth = 1;
  for (let i = 1; i < gridSize; i += 1) {
    context.beginPath();
    context.moveTo(i * cellSize, 0); context.lineTo(i * cellSize, canvas.height);
    context.moveTo(0, i * cellSize); context.lineTo(canvas.width, i * cellSize);
    context.stroke();
  }

  context.fillStyle = "#ff705d";
  context.beginPath();
  context.arc(food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2, cellSize * .34, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#b9f25b";
  context.fillRect(food.x * cellSize + 10, food.y * cellSize + 2, 3, 6);

  snake.forEach((part, index) => {
    context.fillStyle = index === 0 ? "#d7ff82" : `hsl(${86 - Math.min(index, 20)}, 75%, ${58 - Math.min(index, 15)}%)`;
    roundedCell(part.x, part.y, 1.5, index === 0 ? 6 : 5);
    context.fill();
  });

  const head = snake[0];
  const eyeOffset = direction.x === 0 ? 5 : (direction.x > 0 ? 13 : 6);
  context.fillStyle = "#152113";
  if (direction.x !== 0) {
    context.beginPath(); context.arc(head.x * cellSize + eyeOffset, head.y * cellSize + 6, 1.6, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.arc(head.x * cellSize + eyeOffset, head.y * cellSize + 14, 1.6, 0, Math.PI * 2); context.fill();
  } else {
    const eyeY = head.y * cellSize + (direction.y > 0 ? 14 : 6);
    context.beginPath(); context.arc(head.x * cellSize + 6, eyeY, 1.6, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.arc(head.x * cellSize + 14, eyeY, 1.6, 0, Math.PI * 2); context.fill();
  }
}

function tone(frequency, duration) {
  if (!soundEnabled) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const audio = new AudioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(.055, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
}

document.addEventListener("keydown", event => {
  const keyMap = { ArrowUp: "up", w: "up", ArrowDown: "down", s: "down", ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right" };
  const move = keyMap[event.key];
  if (move) { event.preventDefault(); changeDirection(move); }
});

document.querySelectorAll("[data-direction]").forEach(button => {
  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    changeDirection(button.dataset.direction);
  });
});

canvas.addEventListener("pointerdown", event => { touchStart = { x: event.clientX, y: event.clientY }; });
canvas.addEventListener("pointerup", event => {
  if (!touchStart) return;
  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
  changeDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
});

document.querySelector("#startButton").addEventListener("click", startGame);
document.querySelector("#playAgainButton").addEventListener("click", startGame);
document.querySelector("#restartButton").addEventListener("click", startGame);
soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? "♪" : "×";
  soundButton.setAttribute("aria-label", soundEnabled ? "Mute sound" : "Turn on sound");
});

bestScoreElement.textContent = formatScore(bestScore);
resetState();
