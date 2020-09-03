import { HostUI } from "./programmaticUI.js";

const _pageElements = new WeakMap(),
    _typingStatus = new WeakMap(),
    _typingTimeout = new WeakMap();

class PeerConnectionUI {
    constructor({ StartConnection, ConsumeRemoteHandshake, SendChatMessage, SendTypingStatus }) {
        _pageElements.set(this, HostUI());

        this._wireUI({ StartConnection, ConsumeRemoteHandshake, SendChatMessage, SendTypingStatus });
    }

    get elements() { return _pageElements.get(this); }

    _activeTypingInChatBox() {
        if (!_typingStatus.get(this).status)
            _typingStatus.get(this).status = true;

        clearTimeout(_typingTimeout.get(this));
        _typingTimeout.set(this, setTimeout(() => {
            _typingStatus.get(this).status = false;
        }, 1500));
    }

    /**
     * Display received messages
     * @param {String} messageText - Text string send from the remote
     */
    _displayMessage(messageText, fromRemote = false) {
        const { divChatHistory } = this.elements;

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
     * Send a message to the remote host, and display that message locally
     */
    _outboundChatMessage({ SendChatMessage }) {
        const { txtChatEntry } = this.elements;

        let text = (txtChatEntry.value || ``).trim();

        if (text.length > 0) {
            // Reset the chat entry
            txtChatEntry.value = ``;

            // Reset the typing status
            _typingStatus.get(this).status = false;

            SendChatMessage(text);

            this._displayMessage(text);
        }
    }


    /** Read, and process, a remote-host-generated negotiation, and clean up the UI */
    _processRemoteHandshake({ ConsumeRemoteHandshake }) {
        const { txtIncomingHandshake } = this.elements;
        const rawHandshake = (txtIncomingHandshake.value || ``).trim();
        ConsumeRemoteHandshake({ rawHandshake });

        // Clear the entry field
        txtIncomingHandshake.value = null;
    }

    /**
     * Wire up the UI elements
     * @param {*} options
     * @param {Function} options.StartConnection - Called when a host wants to create an RTC offer
     * @param {Function} options.ConsumeRemoteHandshake - Called for any connection negotiation (offer/answer/ice candidate) processing
     * @param {Function} options.SendChatMessage - Called when sending data through to the remote host
     */
    _wireUI({ StartConnection, ConsumeRemoteHandshake, SendChatMessage, SendTypingStatus }) {
        const { btnGenerateOffer, btnConsumeOffer, txtIncomingHandshake, btnSendChat, txtChatEntry } = this.elements;

        // Clicking Generate offer starts the RTC negotiation process
        btnGenerateOffer.addEventListener(`click`, StartConnection, false);

        // Clicking consume offer consumes offer/answer/ice candidate
        btnConsumeOffer.addEventListener(`click`, () => this._processRemoteHandshake({ ConsumeRemoteHandshake }), false);
        // Consume on press of the enter key as well
        txtIncomingHandshake.addEventListener(`keydown`, (evt) => { if (evt.keyCode == 13) this._processRemoteHandshake({ ConsumeRemoteHandshake }); }, false);

        // Click to send a chat message
        btnSendChat.addEventListener(`click`, () => this._outboundChatMessage({ SendChatMessage }), false);
        // Send a chat on enter key as well
        txtChatEntry.addEventListener(`keyup`, (evt) => { if (evt.keyCode == 13) this._outboundChatMessage({ SendChatMessage }); }, false);
        // Track active typing into the chat box
        txtChatEntry.addEventListener(`input`, () => this._activeTypingInChatBox(), false);

        // Use a proxy to trigger the status update so that SendTypingStatus isn't passed in multiple places
        _typingStatus.set(this, new Proxy({ status: false}, {
            get: (target, property) => {
                return target[property];
            },
            set: (target, property, value) => {
                if (property == `status`)
                    SendTypingStatus(value);

                target[property] = value;

                return true;
            },
        }));
    }

    /** Update UI to hide handshake negotiation, and show chat interface */
    ActivateMessaging() {
        const {divConnectionNegotiation, divChat } = this.elements;

        // Hide the handshake UI
        divConnectionNegotiation.classList.add(`inactive`);

        // Show the messaging UI
        divChat.classList.remove(`inactive`);
    }

    /**
     * Handle incoming messages
     * @param {MessageEvent} evt
     */
    RemoteMessageHandler(channel, evt) {
        const { spanRemoteStatus } = this.elements;

        switch (channel.label) {
            case `typing-status`:
                if (evt.data == `true`)
                    spanRemoteStatus.classList.remove(`inactive`);
                else
                    spanRemoteStatus.classList.add(`inactive`);
                break;

            default:
                this._displayMessage(evt.data, true);
        }
    }


    /** Display the next locally-generated negotiation value in the UI */
    ShowNextHandshake({ runState, generatedHandshakes }) {
        const { divHandshake, txtOutgoingHandshake } = this.elements;

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
}

export {
    PeerConnectionUI,
};
