import { UINegotiatedPeer } from "./uiNegotiatedPeer.js";

async function startRTC() {
    const peer = new UINegotiatedPeer();
}

startRTC()
    .catch(err => {
        console.error(`FATAL ERROR`, err);
    });
