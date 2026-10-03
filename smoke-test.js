"use strict";

const fs = require("fs");
const vm = require("vm");

class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.textContent = "";
    this.innerHTML = "";
    this.value = id === "allocationAmount" ? "250" : id === "portfolioBudget" ? "500" : id === "projectionYears" ? "1" : id === "goalSelect" ? "emergency" : "0";
    this.dataset = {};
    this.style = {};
    this.disabled = false;
    this.tagName = "DIV";
    this.listeners = {};
    this.classList = { values: new Set(), add: (...names) => names.forEach(name => this.classList.values.add(name)), remove: (...names) => names.forEach(name => this.classList.values.delete(name)), contains: name => this.classList.values.has(name) };
  }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  setAttribute() {}
  querySelectorAll() { return []; }
  click() { if (this.listeners.click) this.listeners.click({ preventDefault() {} }); }
}

const html = fs.readFileSync("index.html", "utf8");
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error("Duplicate HTML ids found");
const elements = Object.fromEntries(ids.map(id => [id, new FakeElement(id)]));
const canvas = elements.gameBoard;
canvas.width = 400;
canvas.height = 400;
canvas.getContext = () => ({
  fillStyle: "", strokeStyle: "", lineWidth: 1, shadowColor: "", shadowBlur: 0,
  font: "", textAlign: "", textBaseline: "",
  fillRect() {}, strokeRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
  arc() {}, fill() {}, roundRect() {}, rect() {}, fillText() {}, save() {}, restore() {}
});

const directionButtons = ["up", "down", "left", "right"].map(direction => {
  const el = new FakeElement(); el.dataset.direction = direction; return el;
});
const moveButtons = ["save", "invest", "learn", "enjoy", "give", "rental", "luxury"].map(move => {
  const el = new FakeElement(); el.dataset.move = move; return el;
});
const allocationInputs = new Map();
const document = {
  querySelector(selector) {
    if (selector.startsWith("#")) return elements[selector.slice(1)] || null;
    const allocation = selector.match(/^\[data-allocation="([^"]+)"\]$/);
    if (allocation) return allocationInputs.get(allocation[1]) || null;
    return null;
  },
  querySelectorAll(selector) {
    if (selector === "[data-direction]") return directionButtons;
    if (selector === "[data-move]") return moveButtons;
    return [];
  },
  addEventListener() {}
};

elements.allocationList.querySelectorAll = selector => {
  if (selector !== "[data-allocation]") return [];
  allocationInputs.clear();
  for (const id of [...elements.allocationList.innerHTML.matchAll(/data-allocation="([^"]+)"/g)].map(match => match[1])) {
    const input = new FakeElement(); input.value = "0"; input.dataset.allocation = id; allocationInputs.set(id, input);
  }
  return [...allocationInputs.values()];
};

const storage = new Map();
const sandbox = {
  console, document, window: {}, HTMLElement: FakeElement,
  localStorage: { getItem: key => storage.has(key) ? storage.get(key) : null, setItem: (key, value) => storage.set(key, String(value)) },
  Intl, Date, Math, JSON, Number, String, Object, Array,
  setInterval: callback => { sandbox.tick = callback; return 1; }, clearInterval() {}, setTimeout: callback => { callback(); return 1; }, clearTimeout() {}
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync("game.js", "utf8"), sandbox, { filename: "game.js" });
elements.startButton.click();
if (!elements.startOverlay.classList.contains("hidden")) throw new Error("Start overlay did not close");
if (typeof sandbox.tick !== "function") throw new Error("Game loop did not start");
if (!elements.rewardPreview.textContent) throw new Error("Next reward preview did not render");
vm.runInContext("openDecision()", sandbox);
if (elements.decisionOverlay.classList.contains("hidden")) throw new Error("Decision lesson did not open");
if ((elements.decisionChoices.innerHTML.match(/data-decision-choice/g) || []).length !== 3) throw new Error("Decision choices did not render");
vm.runInContext("chooseDecision(0)", sandbox);
if (elements.decisionOutcome.classList.contains("hidden")) throw new Error("Decision outcome did not render");
elements.continueDecisionButton.click();
if (!elements.decisionOverlay.classList.contains("hidden")) throw new Error("Decision lesson did not return to the game");
elements.pauseButton.click();
if (elements.pauseButton.textContent !== "▶ RESUME") throw new Error("Pause control did not pause the run");
elements.pauseButton.click();
if (elements.pauseButton.textContent !== "Ⅱ PAUSE") throw new Error("Pause control did not resume the run");
sandbox.tick();
for (let step = 0; step < 15; step += 1) sandbox.tick();
if (elements.gameOverOverlay.classList.contains("hidden")) throw new Error("Collision did not open the game-over overlay");
elements.playAgainButton.click();
if (!elements.gameOverOverlay.classList.contains("hidden")) throw new Error("Play Again did not restart the game");
console.log(JSON.stringify({ ok: true, ids: ids.length, journeySpaces: (elements.journeyTrack.innerHTML.match(/journey-space/g) || []).length, investmentCards: (elements.investmentGrid.innerHTML.match(/investment-card/g) || []).length, wealthPrinciples: (elements.principleGrid.innerHTML.match(/principle-card/g) || []).length, start: "passed", decisionLesson: "passed", pauseResume: "passed", movement: "passed", gameOver: "passed", restart: "passed" }));
