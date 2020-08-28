import { ConfigureRTCSession } from "./module/index.js";

const
    btnConsumeOffer = document.querySelector(`button.consume_offer`),
    btnGenerateOffer = document.querySelector(`button.generate_offer`),
    btnSendChat = document.querySelector(`button.send_chat`),
    divChat = document.querySelector(`div.page_container.chat`),
    divChatHistory = document.querySelector(`.chat div.history`),
    divConnectionNegotiation = document.querySelector(`div.page_container.negotiator`),
    divHandshake = document.querySelector(`div.send_handshake`),
    txtChatEntry = document.querySelector(`textarea.chat_entry`),
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

    btnSendChat.addEventListener(`click`, sendChatMessage, false);
    // Send a chat on enter key
    txtChatEntry.addEventListener(`keyup`, (evt) => { if (evt.keyCode == 13) sendChatMessage(); }, false);
}

/**
 * Handle incoming messages
 * @param {MessageEvent} evt
 */
function messageFromRemote(channel, evt) {
    displayMessage(evt.data, true);
}

/**
 * Send a message via the data channel for the chat UI
 */
function sendChatMessage() {
    let text = (txtChatEntry.value || ``).trim();

    if (text.length > 0) {
        // Reset the chat entry
        txtChatEntry.value = ``;

        peer.dataChannel.Send(text);
        displayMessage(text);
    }
}

/**
 * Display received messages
 * @param {String} messageText - Text string send from the remote
 */
function displayMessage(messageText, fromRemote = false) {
    // create a row
    const elRow = document.createElement(`div`);
    elRow.className = `row ${fromRemote ? `remote` : `local`}`;

    // create a message
    const el = document.createElement(`div`);
    let txt = document.createTextNode(`${(new Date()).toLocaleString()} - ${messageText}`);
    el.appendChild(txt);
    elRow.appendChild(el);

    divChatHistory.appendChild(elRow);
}


function attachDataChannelHandlers() {
    peer.dataChannel.onInboundMessage = messageFromRemote;

    // When the outbound channel is opened for this connection
    peer.dataChannel.outbound.get(`default`).onOpen = (evt) => {
        const channel = evt.target;

        if (channel.readyState == `open`) {
            // Clear any unused handshake values
            peer.generatedHandshakes.splice(0, peer.generatedHandshakes.length);

            // Hide the handshake UI
            divConnectionNegotiation.classList.add(`inactive`);

            // Show the messaging UI
            divChat.classList.remove(`inactive`);
        }
    };
}

function configurePeer() {
    peer = ConfigureRTCSession();

    // Handle newly created handshake values
    peer.onGeneratedHandshake = showNextHandshake;
}

async function consumeRemoteHandshake() {
    const rawHandshake = (txtIncomingHandshake.value || ``).trim();

    if (rawHandshake.length > 0) {
        // Clear the entry field
        txtIncomingHandshake.value = null;

        // When consuming an RTC offer, this browser will not have a peer yet
        if (!peer)
            configurePeer();

        peer.ConsumeHandshake(rawHandshake);
        attachDataChannelHandlers();

        currentlyProcessingHandshake = false;

        showNextHandshake();
    }
}

async function startConnection() {
    currentlyProcessingHandshake = false;
    await peer.InitiateConnection();
    attachDataChannelHandlers();
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

    configurePeer();
}

startApp();
