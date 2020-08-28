import { ConfigureRTCSession } from "./module/index.js";

const
    btnConsumeOffer = document.querySelector(`button.consume_offer`),
    btnGenerateOffer = document.querySelector(`button.generate_offer`),
    divHandshake = document.querySelector(`div.send_handshake`),
    txtOutgoingHandshake = divHandshake.querySelector(`textarea`),
    txtIncomingHandshake = document.querySelector(`textarea.remote_negotiation`);

let peer,
    currentlyProcessingHandshake = false;

/** Wire up the UI */
function hookUI() {
    btnGenerateOffer.addEventListener(`click`, startConnection, false);

    btnConsumeOffer.addEventListener(`click`, consumeRemoteHandshake, false);
    // Consume a handshake on press of the enter key
    txtIncomingHandshake.addEventListener(`keydown`, (evt) => { if (evt.keyCode == 13) consumeRemoteHandshake(); }, false);
}

async function consumeRemoteHandshake() {
    const rawHandshake = (txtIncomingHandshake.value || ``).trim();

    if (rawHandshake.length > 0) {
        // Clear the entry field
        txtIncomingHandshake.value = null;

        // When consuming an RTC offer, this browser will not have a peer yet
        if (!peer) {
            peer = ConfigureRTCSession();
            peer.onGeneratedHandshake = showNextHandshake;
        }

        peer.ConsumeHandshake(rawHandshake);

        currentlyProcessingHandshake = false;

        showNextHandshake();
    }
}

async function startConnection() {
    currentlyProcessingHandshake = false;
    await peer.InitiateConnection();
}

function showNextHandshake() {
    if (!currentlyProcessingHandshake && (peer.generatedHandshakes.length > 0)) {
        currentlyProcessingHandshake = true;

        divHandshake.classList.remove(`inactive`);

        txtOutgoingHandshake.value = peer.generatedHandshakes.shift();

        // Enable the textbox just long enough to copy the text, and then disable again
        txtOutgoingHandshake.disabled = false;
        txtOutgoingHandshake.focus();
        txtOutgoingHandshake.select();
        document.execCommand(`copy`);
        txtOutgoingHandshake.disabled = true;
    }
}

function startApp() {
    hookUI();

    peer = ConfigureRTCSession();
    peer.onGeneratedHandshake = showNextHandshake;
}

startApp();
