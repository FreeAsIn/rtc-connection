class InboundChannel {
    constructor(peer) {
        this.peer = peer;
        // Register a default message handler for developer feedback
        this.onInboundMessage = evt => {
            this.peer.WriteError(new Error(`Inbound message received: No handler defined for ${this.dataChannel.label} data channel`), null, evt);
        };
    }
    /** Add the RTCDataChannel */
    AddChannel(dataChannel) {
        this.dataChannel = dataChannel;
        // When a message is received
        dataChannel.onmessage = (evt) => {
            this.peer.WriteLog(`MESSAGE RECEIVED`, this.peer.connectionId, dataChannel.label, evt);
            this.onInboundMessage(evt);
        };
        // When the channel closes
        dataChannel.onclose = (evt) => {
            this.peer.WriteLog(`INCOMING DATA CHANNEL CLOSED`, this.peer.connectionId, this.dataChannel);
            this.onClose(evt);
        };
    }
}
export { InboundChannel, };
