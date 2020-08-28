import { ActivateMessaging, HookUI, RemoteMessageHandler, ShowNextHandshake } from "./ui-interaction.js";
import { ConfigureRTCSession } from "./module/index.js";

let peer,
    currentlyProcessingHandshake = false;

function attachDataChannelHandlers() {
    peer.dataChannel.onInboundMessage = RemoteMessageHandler;

    // When the outbound channel is opened for this connection
    peer.dataChannel.outbound.get(`default`).onOpen = (evt) => {
        const channel = evt.target;

        if (channel.readyState == `open`) {
            // Clear any unused handshake values
            peer.generatedHandshakes.splice(0, peer.generatedHandshakes.length);

            ActivateMessaging();
        }
    };
}

function configurePeer() {
    peer = ConfigureRTCSession();

    // Handle newly created handshake values
    peer.onGeneratedHandshake = () => {
        currentlyProcessingHandshake = ShowNextHandshake({ currentlyProcessingHandshake, generatedHandshakes: peer.generatedHandshakes })
    };
}

async function consumeRemoteHandshake({ rawHandshake }) {
    if (rawHandshake.length > 0) {
        // When consuming an RTC offer, this browser will not have a peer yet
        if (!peer)
            configurePeer();

        peer.ConsumeHandshake(rawHandshake);
        attachDataChannelHandlers();

        currentlyProcessingHandshake = ShowNextHandshake({ currentlyProcessingHandshake: false, generatedHandshakes: peer.generatedHandshakes });
    }
}

async function startConnection() {
    currentlyProcessingHandshake = false;
    await peer.InitiateConnection();
    attachDataChannelHandlers();
}

function sendChatMessage(text) {
    peer.dataChannel.Send(text);
}

export {
    configurePeer as ConfigurePeer,
    consumeRemoteHandshake as ConsumeRemoteHandshake,
    sendChatMessage as SendChatMessage,
    startConnection as StartConnection,
};
