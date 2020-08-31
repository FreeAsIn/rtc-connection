const
    btnConsumeOffer = document.querySelector(`button.consume_offer`),
    btnGenerateOffer = document.querySelector(`button.generate_offer`),
    btnSendChat = document.querySelector(`button.send_chat`),
    divChat = document.querySelector(`div.page_container.chat`),
    divChatHistory = document.querySelector(`.chat div.history`),
    divConnectionNegotiation = document.querySelector(`div.page_container.negotiator`),
    divHandshake = document.querySelector(`div.send_handshake`),
    spanRemoteStatus = document.querySelector(`span.remote_status`),
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

/**
 * Wire up the UI elements
 * @param {*} options
 * @param {Function} options.StartConnection - Called when a host wants to create an RTC offer
 * @param {Function} options.ConsumeRemoteHandshake - Called for any connection negotiation (offer/answer/ice candidate) processing
 * @param {Function} options.SendChatMessage - Called when sending data through to the remote host
 */
function hookUI({ StartConnection, ConsumeRemoteHandshake, SendChatMessage, SendTypingStatus }) {
    // Clicking Generate offer starts the RTC negotiation process
    btnGenerateOffer.addEventListener(`click`, StartConnection, false);

    // Clicking consume offer consumes offer/answer/ice candidate
    btnConsumeOffer.addEventListener(`click`, () => processRemoteHandshake({ ConsumeRemoteHandshake }), false);
    // Consume on press of the enter key as well
    txtIncomingHandshake.addEventListener(`keydown`, (evt) => { if (evt.keyCode == 13) processRemoteHandshake({ ConsumeRemoteHandshake }); }, false);

    // Click to send a chat message
    btnSendChat.addEventListener(`click`, () => outboundChatMessage({ SendChatMessage }), false);
    // Send a chat on enter key as well
    txtChatEntry.addEventListener(`keyup`, (evt) => { if (evt.keyCode == 13) outboundChatMessage({ SendChatMessage }); }, false);
    // Track active typing into the chat box
    txtChatEntry.addEventListener(`input`, () => activeTypingInChatBox(), false);

    // Use a proxy to trigger the status update so that SendTypingStatus isn't passed in multiple places
    _typingStatus = new Proxy({ status: false}, {
        get: (target, property) => {
            return target[property];
        },
        set: (target, property, value) => {
            if (property == `status`)
                SendTypingStatus(value);

            target[property] = value;

            return true;
        },
    });
}

let _typingStatus = null,
    _typingTimeout = null;

function activeTypingInChatBox() {
    if (!_typingStatus.status)
        _typingStatus.status = true;

    clearTimeout(_typingTimeout);
    _typingTimeout = setTimeout(() => {
        _typingStatus.status = false;
    }, 1500);
}

/**
 * Handle incoming messages
 * @param {MessageEvent} evt
 */
function messageFromRemote(channel, evt) {
    switch (channel.label) {
        case `typing-status`:
            if (evt.data == `true`)
                spanRemoteStatus.classList.remove(`inactive`);
            else
                spanRemoteStatus.classList.add(`inactive`);
            break;

        default:
            displayMessage(evt.data, true);
    }
}

/**
 * Send a message to the remote host, and display that message locally
 */
function outboundChatMessage({ SendChatMessage }) {
    let text = (txtChatEntry.value || ``).trim();

    if (text.length > 0) {
        // Reset the chat entry
        txtChatEntry.value = ``;

        // Reset the typing status
        _typingStatus.status = false;

        SendChatMessage(text);

        displayMessage(text);
    }
}

/** Read, and process, a remote-host-generated negotiation, and clean up the UI */
function processRemoteHandshake({ ConsumeRemoteHandshake }) {
    const rawHandshake = (txtIncomingHandshake.value || ``).trim();
    ConsumeRemoteHandshake({ rawHandshake });

    // Clear the entry field
    txtIncomingHandshake.value = null;
}

/** Display the next locally-generated negotiation value in the UI */
function showNextHandshake({ runState, generatedHandshakes }) {
    if (!runState.currentlyProcessingHandshake && (generatedHandshakes.length > 0)) {
        runState.currentlyProcessingHandshake = true;

        divHandshake.classList.remove(`inactive`);

        txtOutgoingHandshake.value = generatedHandshakes.shift();

        // Enable the textbox just long enough to copy the text, and then disable again
        txtOutgoingHandshake.disabled = false;
        txtOutgoingHandshake.focus();
        txtOutgoingHandshake.select();
        document.execCommand(`copy`);
        txtOutgoingHandshake.disabled = true;
    }
}

export {
    activateMessaging as ActivateMessaging,
    hookUI as HookUI,
    messageFromRemote as RemoteMessageHandler,
    showNextHandshake as ShowNextHandshake,
};
