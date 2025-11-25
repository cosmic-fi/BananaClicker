import SHA256 from "crypto-js/sha256";

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
            console.warn("%c[🍌 BananaGuard] Hash mismatch: tampering detected!", "color:red;font-size:16px");
            return { ok: false };
        }

        return { ok: true };
    } catch (e) {
        console.error("[🍌 BananaGuard] Failed to verify save:", e);
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
        console.warn("%c[🍌 BananaGuard] Honeypot triggered: Cheater detected!", "color:red;font-size:22px");
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
            console.warn("%c[🍌 BananaGuard] DevTools detected!", "color:orange;font-size:18px");
        }
    }, 800);
}

function listenToStorage() {
    window.addEventListener("storage", (event) => {
        if (event.key === SAVE_KEY) {
            console.warn("%c[🍌 BananaGuard] External save modification detected!", "color:red;font-size:18px");
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
                console.warn("%c[🍌 BananaGuard] Live tamper detected!", "color:red;font-size:20px");
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
            console.error("[🍌 BananaGuard] LiveScan error:", e);
        }
    }, 1500);
}

function bananaBanner() {
    console.log("%c 🍌 BananaGuard Activated", "color:yellow;font-size:26px;font-weight:bold;");
    console.log("%c[🛡️ BananaGuard] Status: Running...", "color:#ffcc00;font-size:16px");
    console.log("%cKeep your bananas safe from cheaters 😎", "color:#ffaa00;font-size:14px");
}

export function startBananaGuard() {
    bananaBanner();

    deployHoneyPot();
    detectDevtools();
    listenToStorage();
    liveBananaScan();
}