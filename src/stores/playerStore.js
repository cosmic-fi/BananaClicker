import { writable } from 'svelte/store';
import SHA256 from 'crypto-js/sha256';

// ==========================
// 🍌 Upgrade List
// ==========================
export const upgradesList = [
  { name: "+1 per click", cost: 10, value: 1, label: "+1 per click", type: "click" },
  { name: "+5 per click", cost: 75, value: 5, label: "+5 per click", type: "click" },
  { name: "+10 per click", cost: 250, value: 10, label: "+10 per click", type: "click" },
  { name: "+50 per click", cost: 1000, value: 50, label: "+50 per click", type: "click" },
  { name: "+100 per click", cost: 5000, value: 100, label: "+100 per click", type: "click" },

  { name: "Auto Clicker +100/s", cost: 24000, value: 100, label: "Auto Clicker", type: "auto" },
  { name: "Auto Clicker +500/s", cost: 100000, value: 500, label: "Auto Clicker", type: "auto" },
  { name: "Super Auto Clicker +1k/s", cost: 250000, value: 1000, label: "Super Auto Clicker", type: "auto" },
  { name: "Golden Auto Clicker +10k/s", cost: 850000, value: 10000, label: "Golden Auto Clicker", type: "auto" },

  { name: "Mega Clicks +100k per click", cost: 5000000, value: 100000, label: "Mega Clicks", type: "click" },

  { name: "Banana Magnet (x2 Clicks)", cost: 5000000, value: 2, label: "Banana Magnet", type: "multiplier" },
  { name: "Golden Clicks (x5 Clicks)", cost: 7000000, value: 5, label: "Golden Clicks", type: "multiplier" },

  { name: "Banana Factory +200k/s", cost: 20000000, value: 200000, label: "Banana Factory", type: "auto" },
  { name: "Ultra Auto Clicker +20M/s", cost: 75000000, value: 20000000, label: "Ultra Auto Clicker", type: "auto" },
  { name: "OP Banana God +500M/s", cost: 15000000000000, value: 50000000, label: "Banana God", type: "auto" },
];


// ==========================
// 🍌 Default Player Save
// ==========================
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


// ==========================
// 🍌 BananaGuard Hashing
// ==========================
function peelBanana(data) {
  return SHA256(JSON.stringify(data)).toString();
}


// ==========================
// 🍌 Load with BananaGuard
// ==========================
function BananaGuardLoad() {
  try {
    const raw = localStorage.getItem("bananaClicker");
    if (!raw) return defaultData;

    const parsed = JSON.parse(raw);

    // Missing fields = invalid
    if (!parsed.data || !parsed.bananaPeel) return defaultData;

    // Validate integrity
    const expected = peelBanana(parsed.data);

    if (expected !== parsed.bananaPeel) {
      console.warn("%c[🍌 BananaGuard] Tampering detected. Resetting save!", "color:red;font-size:16px");
      return defaultData;
    }

    // Verified
    console.log("%c[🛡️ BananaGuard] Save integrity verified.", "color:#7CFC00;font-size:14px");

    return parsed.data;

  } catch (err) {
    console.error("BananaGuard failed to load:", err);
    return defaultData;
  }
}


// ==========================
// 🍌 Save with BananaGuard
// ==========================
function BananaGuardSave(data) {
  try {
    const sealedBanana = {
      data,
      bananaPeel: peelBanana(data)
    };

    localStorage.setItem("bananaClicker", JSON.stringify(sealedBanana));
  } catch (err) {
    console.error("BananaGuard failed to save:", err);
  }
}


// ==========================
// 🍌 Writable Store
// ==========================
export const playerData = writable(BananaGuardLoad());

playerData.subscribe((data) => BananaGuardSave(data));