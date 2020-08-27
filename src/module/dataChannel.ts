import { Peer } from "./peer";

/** RTC Data Channel */
class DataChannel {
    /**
     * @param peer - a reference to the peer object using this data channel
     */
    constructor(private readonly peer: Peer) {
        // Default handlers do nothing
        this.onInboundMessage = (evt) => { this.peer.writeError(new Error(`Inbound message received: No onInboundMessage handler defined for data channel`), null, evt); };
        this.onOutboundOpen = (evt) => { this.peer.writeWarning(`No onOutboundOpen handler defined for data channel`, evt); };
        this.onOutboundClose = (evt) => { this.peer.writeWarning(`No onOutboundClose handler defined for data channel`, evt); };
    }

    /** Data channel for incoming messages */
    public inbound: RTCDataChannel;
    /** Handler called for inbound message */
    public onInboundMessage: (evt: Event) => void;

    /** Data channel for outgoing messages */
    public outbound: RTCDataChannel;
    /** Handler for outbound data channel opening */
    public onOutboundOpen: (evt: Event) => void;
    /** Handler for outbound data channel closing */
    public onOutboundClose: (evt: Event) => void;
}

export {
    DataChannel,
};
