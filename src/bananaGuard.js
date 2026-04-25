import SHA256 from "crypto-js/sha256";
import logger from "./utils/logger";


const SAVE_KEY = "bananaClicker";
const HONEYPOT_KEY = "bananaClicker_cheat_detect";
const HONEYPOT_VALUE = "DO_NOT_EDIT";

export function peelBanana(data) {
    return SHA256(JSON.stringify(data)).toString();
}

export function verifyBananaSave() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return { ok: false };

        const parsed = JSON.parse(raw);
        if (!parsed.data || !parsed.bananaPeel) return { ok: false };

        const newHash = peelBanana(parsed.data);
        if (newHash !== parsed.bananaPeel) {
            logger.warn("Hash mismatch: tampering detected!");
            return { ok: false };
        }

        return { ok: true };
    } catch (e) {
        logger.error("Failed to verify save:", e);
        return { ok: false };
    }
}

export function saveBananaGuard(data) {
    const payload = {
        data,
        bananaPeel: peelBanana(data)
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

function deployHoneyPot() {
    if (localStorage.getItem(HONEYPOT_KEY) !== HONEYPOT_VALUE) {
        localStorage.setItem(HONEYPOT_KEY, HONEYPOT_VALUE);
    }
}

function checkHoneyPot() {
    const trap = localStorage.getItem(HONEYPOT_KEY);
    if (trap !== HONEYPOT_VALUE) {
        logger.warn("Honeypot triggered: Cheater detected!");
        return true;
    }
    return false;
}

function detectDevtools() {
    const threshold = 100;

    setInterval(() => {
        const start = performance.now();
        debugger; 
        if (performance.now() - start > threshold) {
            logger.warn("DevTools detected!");
        }
    }, 800);
}

function listenToStorage() {
    window.addEventListener("storage", (event) => {
        if (event.key === SAVE_KEY) {
            logger.warn("External save modification detected!");
            location.reload();
        }
    });
}

function liveBananaScan() {
    setInterval(() => {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return;

            const parsed = JSON.parse(raw);

            if (peelBanana(parsed.data) !== parsed.bananaPeel) {
                logger.warn("Live tamper detected!");
                localStorage.removeItem(SAVE_KEY);
                localStorage.removeItem(HONEYPOT_KEY);
                location.reload();
            }

            if (checkHoneyPot()) {
                localStorage.removeItem(SAVE_KEY);
                localStorage.removeItem(HONEYPOT_KEY);
                location.reload();
            }

        } catch (e) {
            logger.error("LiveScan error:", e);
        }
    }, 1500);
}

function bananaBanner() {
    logger.banana("BananaGuard Activated");
    logger.info("Status: Running...");
    logger.info("Keep your bananas safe from cheaters 😎");
}

export function startBananaGuard() {
    bananaBanner();

    deployHoneyPot();
    detectDevtools();
    listenToStorage();
    liveBananaScan();
}