"use strict";

const canvas = document.querySelector("#gameBoard");
const context = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#bestScore");
const walletElement = document.querySelector("#wallet");
const startOverlay = document.querySelector("#startOverlay");
const gameOverOverlay = document.querySelector("#gameOverOverlay");
const finalScoreElement = document.querySelector("#finalScore");
const resultMessage = document.querySelector("#resultMessage");
const endEyebrow = document.querySelector("#endEyebrow");
const soundButton = document.querySelector("#soundButton");
const moveFeedback = document.querySelector("#moveFeedback");
const gridSize = 20;
const cellSize = canvas.width / gridSize;
const speed = 115;
const CASH_PER_BILL = 250;
const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function readNumber(key, fallback = 0) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  } catch {
    return fallback;
  }
}
function writeValue(key, value) {
  try { localStorage.setItem(key, String(value)); } catch { /* The game remains playable without saved progress. */ }
}
function readObject(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value && typeof value === "object" ? value : fallback;
  } catch {
    return fallback;
  }
}
function getLegacyBest() {
  const oldPoints = readNumber("pocketSnakeBest", 0);
  return Math.floor(oldPoints / 10) * CASH_PER_BILL;
}

let snake;
let food;
let direction;
let queuedDirection;
let score = 0;
let bestScore = Math.max(readNumber("wealthiestSnakeBest", 0), getLegacyBest());
let wallet = readNumber("wealthiestSnakeWallet", 0);
let lifetimeEarned = readNumber("wealthiestSnakeLifetime", wallet);
let allocations = readObject("wealthiestSnakeMoves", { save: 0, invest: 0, learn: 0, enjoy: 0 });
let timer;
let playing = false;
let soundEnabled = true;
let touchStart = null;
let turnedThisStep = false;
let audioContext;

function formatMoney(value) { return money.format(value); }

function updateStats() {
  scoreElement.textContent = formatMoney(score);
  bestScoreElement.textContent = formatMoney(bestScore);
  walletElement.textContent = formatMoney(wallet);
}

function resetState() {
  snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
  direction = directions.right;
  queuedDirection = directions.right;
  turnedThisStep = false;
  score = 0;
  food = makeFood();
  updateStats();
  draw();
}

function makeFood() {
  if (snake.length >= gridSize * gridSize) return null;
  let next;
  do {
    next = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
  } while (snake.some(part => part.x === next.x && part.y === next.y));
  return next;
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
  turnedThisStep = false;
  const head = snake[0];
  const nextHead = { x: head.x + direction.x, y: head.y + direction.y };
  const hitWall = nextHead.x < 0 || nextHead.x >= gridSize || nextHead.y < 0 || nextHead.y >= gridSize;
  const eating = food && nextHead.x === food.x && nextHead.y === food.y;
  const bodyToCheck = eating ? snake : snake.slice(0, -1);
  const hitSelf = bodyToCheck.some(part => part.x === nextHead.x && part.y === nextHead.y);

  if (hitWall || hitSelf) {
    endGame(false);
    return;
  }

  snake.unshift(nextHead);
  if (eating) {
    score += CASH_PER_BILL;
    wallet += CASH_PER_BILL;
    lifetimeEarned += CASH_PER_BILL;
    bestScore = Math.max(score, bestScore);
    writeValue("wealthiestSnakeBest", bestScore);
    writeValue("wealthiestSnakeWallet", wallet);
    writeValue("wealthiestSnakeLifetime", lifetimeEarned);
    food = makeFood();
    updateStats();
    tone(620, 0.07);
    if (!food) {
      draw();
      endGame(true);
      return;
    }
  } else {
    snake.pop();
  }
  draw();
}

function endGame(won) {
  playing = false;
  clearInterval(timer);
  finalScoreElement.textContent = won ? "You own the whole board!" : `Run cash: ${formatMoney(score)}`;
  if (won) {
    endEyebrow.textContent = "BOARD CLEARED";
    resultMessage.textContent = "Every cash stack is yours. That’s a legendary run!";
  } else {
    endEyebrow.textContent = "RUN COMPLETE";
    resultMessage.textContent = score > 0 && score >= bestScore
      ? "New personal best. Put that game cash to work in the wallet."
      : "Every run is a new chance to level up. Your game cash stays in your wallet.";
  }
  gameOverOverlay.classList.remove("hidden");
  tone(won ? 800 : 135, won ? 0.24 : 0.2);
}

function changeDirection(name) {
  if (!playing || turnedThisStep) return;
  const next = directions[name];
  if (!next) return;
  if (next.x + direction.x === 0 && next.y + direction.y === 0) return;
  queuedDirection = next;
  turnedThisStep = true;
}

function roundedCell(x, y, inset, radius) {
  const left = x * cellSize + inset;
  const top = y * cellSize + inset;
  const size = cellSize - inset * 2;
  context.beginPath();
  if (typeof context.roundRect === "function") {
    context.roundRect(left, top, size, size, radius);
  } else {
    context.rect(left, top, size, size);
  }
}

function drawCash(x, y) {
  const left = x * cellSize + 3;
  const top = y * cellSize + 5;
  context.fillStyle = "#ffc94a";
  context.fillRect(left, top, cellSize - 6, cellSize - 10);
  context.strokeStyle = "#80551a";
  context.lineWidth = 1;
  context.strokeRect(left + 1, top + 1, cellSize - 8, cellSize - 12);
  context.fillStyle = "#44300f";
  context.font = "bold 10px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("$", left + (cellSize - 6) / 2, top + (cellSize - 10) / 2);
}

function draw() {
  context.fillStyle = "#171c12";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(216,255,53,.06)";
  context.lineWidth = 1;
  for (let i = 1; i < gridSize; i += 1) {
    context.beginPath();
    context.moveTo(i * cellSize, 0);
    context.lineTo(i * cellSize, canvas.height);
    context.moveTo(0, i * cellSize);
    context.lineTo(canvas.width, i * cellSize);
    context.stroke();
  }

  if (food) drawCash(food.x, food.y);

  snake.forEach((part, index) => {
    context.fillStyle = index === 0 ? "#f4ffad" : `hsl(${76 - Math.min(index, 18)}, 90%, ${58 - Math.min(index, 12)}%)`;
    roundedCell(part.x, part.y, 1.5, index === 0 ? 6 : 5);
    context.fill();
  });

  const head = snake[0];
  context.fillStyle = "#222512";
  if (direction.x !== 0) {
    const eyeX = head.x * cellSize + (direction.x > 0 ? 13 : 6);
    [6, 14].forEach(offset => {
      context.beginPath();
      context.arc(eyeX, head.y * cellSize + offset, 1.6, 0, Math.PI * 2);
      context.fill();
    });
  } else {
    const eyeY = head.y * cellSize + (direction.y > 0 ? 14 : 6);
    [6, 14].forEach(offset => {
      context.beginPath();
      context.arc(head.x * cellSize + offset, eyeY, 1.6, 0, Math.PI * 2);
      context.fill();
    });
  }
}

function tone(frequency, duration) {
  if (!soundEnabled) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    audioContext ||= new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.045, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch { /* Audio is optional; movement never depends on it. */ }
}

function todayKey() {
  const today = new Date();
  return `wealthiestSnakeMission-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}
function updateMission() {
  let complete = false;
  try { complete = localStorage.getItem(todayKey()) === "done"; } catch { /* Daily mission progress is optional. */ }
  document.querySelector("#missionStatus").textContent = complete ? "1 / 1 MOVES" : "0 / 1 MOVES";
  document.querySelector("#missionBar").style.width = complete ? "100%" : "0%";
  document.querySelector("#missionButton").textContent = complete ? "TODAY'S MOVE IS LOGGED ✓" : "MARK A MONEY MOVE DONE  ＋";
  document.querySelector("#missionButton").disabled = complete;
}
function practiceMove(type) {
  const amount = Number(document.querySelector("#allocationAmount").value);
  if (wallet < amount) {
    moveFeedback.textContent = `You need ${formatMoney(amount)} in game cash first. Play a run to stack more.`;
    return;
  }
  const descriptions = {
    save: "Practice choice: save it for emergencies or a near-term goal.",
    invest: "Practice choice: investing can grow over time, but value can also fall. Learn the risks first.",
    learn: "Practice choice: use part of a budget to build a useful skill or learn more.",
    enjoy: "Practice choice: planned spending can be part of a balanced money plan.",
  };
  wallet -= amount;
  allocations[type] = (Number(allocations[type]) || 0) + amount;
  writeValue("wealthiestSnakeWallet", wallet);
  writeValue("wealthiestSnakeMoves", JSON.stringify(allocations));
  updateStats();
  moveFeedback.textContent = `${formatMoney(amount)} simulated toward “${type}.” ${descriptions[type]}`;
  tone(500, 0.08);
}

document.addEventListener("keydown", event => {
  if (event.target instanceof HTMLElement && ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(event.target.tagName)) return;
  const keyMap = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
  const move = keyMap[event.key];
  if (move && playing) {
    event.preventDefault();
    changeDirection(move);
  }
});

document.querySelectorAll("[data-direction]").forEach(button => {
  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    changeDirection(button.dataset.direction);
  });
});

canvas.addEventListener("pointerdown", event => {
  touchStart = { x: event.clientX, y: event.clientY };
});
canvas.addEventListener("pointerup", event => {
  if (!touchStart) return;
  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
  changeDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
});
canvas.addEventListener("pointercancel", () => { touchStart = null; });

document.querySelector("#startButton").addEventListener("click", startGame);
document.querySelector("#playAgainButton").addEventListener("click", startGame);
document.querySelector("#restartButton").addEventListener("click", startGame);
soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? "♫ SOUND ON" : "♫ SOUND OFF";
  soundButton.setAttribute("aria-label", soundEnabled ? "Mute sound" : "Turn on sound");
});
document.querySelector("#missionButton").addEventListener("click", () => {
  writeValue(todayKey(), "done");
  updateMission();
});
document.querySelectorAll("[data-move]").forEach(button => {
  button.addEventListener("click", () => practiceMove(button.dataset.move));
});

bestScoreElement.textContent = formatMoney(bestScore);
updateMission();
resetState();
