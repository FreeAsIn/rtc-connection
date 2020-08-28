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

/** Update UI to hide handshake negotiation, and show chat interface */
function activateMessaging() {
    // Hide the handshake UI
    divConnectionNegotiation.classList.add(`inactive`);

    // Show the messaging UI
    divChat.classList.remove(`inactive`);
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

/** Wire up the UI */
function hookUI({ StartConnection, ConsumeRemoteHandshake, SendChatMessage }) {
    btnGenerateOffer.addEventListener(`click`, StartConnection, false);

    btnConsumeOffer.addEventListener(`click`, () => processRemoteHandshake({ ConsumeRemoteHandshake }), false);
    // Consume a handshake on press of the enter key
    txtIncomingHandshake.addEventListener(`keydown`, (evt) => { if (evt.keyCode == 13) processRemoteHandshake({ ConsumeRemoteHandshake }); }, false);

    btnSendChat.addEventListener(`click`, () => outboundChatMessage({ SendChatMessage }), false);
    // Send a chat on enter key
    txtChatEntry.addEventListener(`keyup`, (evt) => { if (evt.keyCode == 13) outboundChatMessage({ SendChatMessage }); }, false);
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
function outboundChatMessage({ SendChatMessage }) {
    let text = (txtChatEntry.value || ``).trim();

    if (text.length > 0) {
        // Reset the chat entry
        txtChatEntry.value = ``;

        SendChatMessage(text);

        displayMessage(text);
    }
}

function processRemoteHandshake({ ConsumeRemoteHandshake }) {
    const rawHandshake = (txtIncomingHandshake.value || ``).trim();
    ConsumeRemoteHandshake({ rawHandshake });

    // Clear the entry field
    txtIncomingHandshake.value = null;
}

function showNextHandshake({ currentlyProcessingHandshake, generatedHandshakes }) {
    if (!currentlyProcessingHandshake && (generatedHandshakes.length > 0)) {
        currentlyProcessingHandshake = true;

        divHandshake.classList.remove(`inactive`);

        txtOutgoingHandshake.value = generatedHandshakes.shift();

        // Enable the textbox just long enough to copy the text, and then disable again
        txtOutgoingHandshake.disabled = false;
        txtOutgoingHandshake.focus();
        txtOutgoingHandshake.select();
        document.execCommand(`copy`);
        txtOutgoingHandshake.disabled = true;
    }

    return currentlyProcessingHandshake;
}

export {
    activateMessaging as ActivateMessaging,
    hookUI as HookUI,
    messageFromRemote as RemoteMessageHandler,
    showNextHandshake as ShowNextHandshake,
};