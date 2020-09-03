function addElement(tag, parent, classes) {
    const newElement = document.createElement(tag);
    parent.appendChild(newElement);

    if (!!classes)
        newElement.classList.add(...classes.split(` `));

    return newElement;
}

function button(parent, text, classes, type = `button`) {
    const btn = addElement(`button`, parent, classes);
    btn.type = type;
    textNode(btn, text);
    return btn;
}

function div(parent, classes) {
    return addElement(`div`, parent, classes);
}

function hr(parent, classes) {
    return addElement(`hr`, parent, classes);
}

function label(parent, text, classes) {
    const lbl = addElement(`label`, parent, classes);
    textNode(lbl, text);
    return lbl;
}

function span(parent, classes, text) {
    const spn = addElement(`span`, parent, classes);

    if (!!text)
        textNode(spn, text);

    return spn;
}

function textNode(parent, text) {
    parent.textContent = text;
}

function textarea(parent, classes) {
    return addElement(`textarea`, parent, classes);
}

function hostUI() {
    const htmlBody = document.querySelector(`body`);

    const divConnectionNegotiation = div(htmlBody, `page_container column negotiator`),
        offerRow = div(divConnectionNegotiation, `row`),
        btnGenerateOffer = button(offerRow, `Generate Offer`, `generate_offer`),
        divHandshake = div(divConnectionNegotiation, `row send_handshake inactive`),
        handshakeColumn = div(divHandshake, `column`),
        handshakeNote = label(handshakeColumn, `This text is automatically copied to your clipboard. Paste into the Consume Offer box of another browser`),
        txtOutgoingHandshake = textarea(handshakeColumn, `negotiator`),
        consumeRemoteRow = div(divConnectionNegotiation, `row`),
        consumeRemoteColumn = div(consumeRemoteRow, `column`),
        txtIncomingHandshake = textarea(consumeRemoteColumn, `remote_negotiation negotiator`),
        btnConsumeOffer = button(consumeRemoteColumn, `Consume Offer`, `consume_offer`),
        divChat = div(htmlBody, `page_container column chat inactive`),
        chatEntryRow = div(divChat, `row`),
        chatEntryColumn = div(chatEntryRow, `column`),
        spanRemoteStatus = span(chatEntryColumn, `remote_status inactive`, `Remote host is typing...`),
        txtChatEntry = textarea(chatEntryColumn, `chat_entry`),
        btnSendChat = button(chatEntryColumn, `Send`, `send_chat`),
        chatHistoryRow = div(divChat, `row`),
        divChatHistory = div(chatHistoryRow, `column history`);

    return {
        btnConsumeOffer,
        btnGenerateOffer,
        btnSendChat,
        divChat,
        divChatHistory,
        divConnectionNegotiation,
        divHandshake,
        spanRemoteStatus,
        txtChatEntry,
        txtOutgoingHandshake,
        txtIncomingHandshake,
    };
}

function addHost() {
    return new Promise(resolve => {
        const htmlBody = document.querySelector(`body`);

        const separator = hr(htmlBody),
            btnAddHost = button(htmlBody, `Add Peer Connection`);

        btnAddHost.addEventListener(`click`, () => resolve(btnAddHost), false);
    });
}

export {
    addHost as AddHost,
    hostUI as HostUI,
};
