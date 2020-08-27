import { ConfigureRTCSession } from "./module/index.js";

const btnGenerateOffer = document.querySelector("button.generate_offer"),
    divHandshake = document.querySelector("div.send_handshake"),
    txtHandshake = divHandshake.querySelector("textarea");

let peer,
    currentlyProcessingHandshake = false;

function hookUI() {
    btnGenerateOffer.addEventListener("click", StartConnection, false);
}

async function StartConnection() {
    currentlyProcessingHandshake = false;
    await peer.InitiateConnection();
}

function ShowNextHandshake(handshakes) {
    if (!currentlyProcessingHandshake && (handshakes.length > 0)) {
        currentlyProcessingHandshake = true;

        divHandshake.classList.remove("inactive");

        txtHandshake.value = handshakes.shift();

        // Enable the textbox just long enough to copy the text, and then disable again
        txtHandshake.disabled = false;
        txtHandshake.focus();
        txtHandshake.select();
        document.execCommand("copy");
        txtHandshake.disabled = true;
    }
}

function startApp() {
    hookUI();

    peer = ConfigureRTCSession();
    peer.onGeneratedHandshake = ShowNextHandshake;
}

startApp();
