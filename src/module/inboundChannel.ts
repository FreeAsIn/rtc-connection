import { Peer } from "./peer";

class InboundChannel {
    constructor(private readonly peer: Peer) {
        // Register a default message handler for developer feedback
        this.onInboundMessage = evt => {
            this.peer.WriteError(new Error(`Inbound message received: No handler defined for ${this.dataChannel.label} data channel`), null, evt);
        };
    }

    private dataChannel: RTCDataChannel;

    /** Handler called for inbound message */
    public onInboundMessage: (evt: MessageEvent) => void;

    /** Handler executes after the channel closes */
    public onClose: (evt: Event) => void;

    /** Add the RTCDataChannel */
    public AddChannel(dataChannel: RTCDataChannel): void {
        this.dataChannel = dataChannel;

        // When a message is received
        dataChannel.onmessage = (evt: MessageEvent) => {
            this.peer.WriteLog(`MESSAGE RECEIVED`, this.peer.connectionId, dataChannel.label, evt);

            this.onInboundMessage(evt);
        };

        // When the channel closes
        dataChannel.onclose = (evt: Event) => {
            this.peer.WriteLog(`INCOMING DATA CHANNEL CLOSED`, this.peer.connectionId, this.dataChannel);

            this.onClose(evt);
        };
    }
}

export {
    InboundChannel,
};
