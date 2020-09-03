import { UINegotiatedPeer } from "./uiNegotiatedPeer.js";
import { AddHost } from "./programmaticUI.js";

const peers = [];

async function createNewPeerConnectionHost() {
    const btnHost = await AddHost();
    btnHost.remove();

    await startRTC();
}

async function startRTC() {
    peers.push(new UINegotiatedPeer());

    await createNewPeerConnectionHost();
}

startRTC()
    .catch(err => {
        console.error(`FATAL ERROR`, err);
    });
