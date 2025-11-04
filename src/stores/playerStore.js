import { writable } from 'svelte/store';

// Default upgrades list
const defaultUpgrades = [
  { name: "+1 per click", cost: 10, value: 1, label: "+1 per click", type: "click" },
  { name: "+5 per click", cost: 10, value: 5, label: "+5 per click", type: "click" },
  { name: "+10 per click", cost: 100, value: 10, label: "+10 per click", type: "click" },
  { name: "+50 per click", cost: 1000, value: 50, label: "+50 per click", type: "click" },
  { name: "+100 per click", cost: 5000, value: 100, label: "+100 per click", type: "click" },
  { name: "+500 per click", cost: 20000, value: 500, label: "+500 per click", type: "click" },
  { name: "+1k per click", cost: 35000, value: 1000, label: "+1k per click", type: "click" },
  { name: "+5k per click", cost: 50000, value: 5000, label: "+5k per click", type: "click" },
  { name: "+10k per click", cost: 1000000, value: 10000, label: "+10k per click", type: "click" },
  { name: "Auto Clicker +50k", cost: 2000000, value: 50000, label: "Autoclicker-50k", type: "auto" },
  { name: "OP Auto Clicker +100M", cost: 1000000000, value: 300000000, label: "Autoclicker-OP", type: "auto" }
];

// Default player data
const defaultData = {
  bananas: 0,
  bananasPerClick: 1,
  autoClickPower: 0,
  soundFX: true,
  music: true,
  upgrades: [] // will store bought upgrades as { label, cost }
};

// Helper to load from localStorage
function loadData() {
  try {
    const data = localStorage.getItem('bananaClicker');
    return data ? JSON.parse(data) : defaultData;
  } catch (e) {
    console.error("Failed to load player data:", e);
    return defaultData;
  }
}

// Writable store
export const playerData = writable(loadData());

// Auto-save to localStorage
playerData.subscribe(value => {
  try {
    localStorage.setItem('bananaClicker', JSON.stringify(value));
  } catch (e) {
    console.error("Failed to save player data:", e);
  }
});

// Export default upgrades for your component to use
export const upgradesList = defaultUpgrades;