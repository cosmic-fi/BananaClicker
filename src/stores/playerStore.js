import { writable } from 'svelte/store';
import SHA256 from 'crypto-js/sha256';

// Default upgrades list
const defaultUpgrades = [
  { name: "+1 per click", cost: 10, value: 1, label: "+1 per click", type: "click" },
  { name: "+5 per click", cost: 75, value: 5, label: "+5 per click", type: "click" },
  { name: "+10 per click", cost: 250, value: 10, label: "+10 per click", type: "click" },
  { name: "+50 per click", cost: 1000, value: 50, label: "+50 per click", type: "click" },
  { name: "+100 per click", cost: 5000, value: 100, label: "+100 per click", type: "click" },

  { name: "Auto Clicker +1k/s", cost: 24000, value: 1000, label: "Auto Clicker", type: "auto" },
  { name: "Super Auto Clicker +10k/s", cost: 150000, value: 10000, label: "Super Auto Clicker", type: "auto" },
  { name: "Golden Auto Clicker +100k/s", cost: 750000, value: 100000, label: "Golden Auto Clicker", type: "auto" },

  { name: "Mega Clicks +1M per click", cost: 5000000, value: 1000000, label: "Mega Clicks", type: "click" },
  { name: "Banana Factory +5M/s", cost: 20000000, value: 5000000, label: "Banana Factory", type: "auto" },

  { name: "Banana Magnet (x2 Clicks)", cost: 5000000, value: 2, label: "Banana Magnet", type: "multiplier" },
  { name: "Golden Clicks (x5 Clicks)", cost: 125000000, value: 5, label: "Golden Clicks", type: "multiplier" },

  { name: "Ultra Auto Clicker +50M/s", cost: 750000000, value: 50000000, label: "Ultra Auto Clicker", type: "auto" },
  { name: "OP Banana God +300M/s", cost: 1500000000, value: 300000000, label: "Banana God", type: "auto" },
];

// Default player data
const defaultData = {
  bananas: 0,
  bananasPerClick: 1,
  baseBananasPerClick: 1,
  baseAutoClickPower: 0,
  multiplier: 0,
  autoClickPower: 0,
  soundFX: true,
  music: true,
  upgrades: [],
  activeEffects: {}
};

// --- Hash helpers ---
function hashData(data) {
  return SHA256(JSON.stringify(data)).toString();
}

function loadData() {
  try {
    const raw = localStorage.getItem('bananaClicker');
    if (!raw) return defaultData;

    const parsed = JSON.parse(raw);
    if (!parsed.data || !parsed.hash) return defaultData;

    const checkHash = hashData(parsed.data);
    if (checkHash !== parsed.hash) {
      console.warn('Player data tampered! Resetting.');
      return defaultData;
    }

    return parsed.data;
  } catch (e) {
    console.error("Failed to load player data:", e);
    return defaultData;
  }
}

function saveData(data) {
  try {
    const toSave = {
      data,
      hash: hashData(data)
    };
    localStorage.setItem('bananaClicker', JSON.stringify(toSave));
  } catch (e) {
    console.error("Failed to save player data:", e);
  }
}

// --- Writable store ---
export const playerData = writable(loadData());

playerData.subscribe(data => {
  saveData(data);
});

export const upgradesList = defaultUpgrades;