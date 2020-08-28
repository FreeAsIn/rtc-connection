import { Peer } from "./peer";

/** RTC Data Channel */
class DataChannel {
    /**
     * @param peer - a reference to the peer object using this data channel
     */
    constructor(private readonly peer: Peer, public readonly name: string) {
        // Default handlers do nothing
        this.onInboundMessage = (evt) => { this.peer.WriteError(new Error(`Inbound message received: No onInboundMessage handler defined for data channel`), null, evt); };
        this.onOutboundOpen = (evt) => { this.peer.WriteWarning(`No onOutboundOpen handler defined for data channel`, evt); };
        this.onOutboundClose = (evt) => { this.peer.WriteWarning(`No onOutboundClose handler defined for data channel`, evt); };

        this.configureConnection();
    }

    /** Data channel for incoming messages */
    public inbound: RTCDataChannel;
    /** Handler called for inbound message */
    public onInboundMessage: (evt: MessageEvent) => void;

    /** Data channel for outgoing messages */
    public outbound: RTCDataChannel;
    /** Handler for outbound data channel opening */
    public onOutboundOpen: (evt: Event) => void;
    /** Handler for outbound data channel closing */
    public onOutboundClose: (evt: Event) => void;

    private configureConnection() {
        this.peer.peerConnection.ondatachannel = (evt: RTCDataChannelEvent) => {
            this.inbound = evt.channel;

            this.peer.WriteLog(`Data channel "${this.inbound.label}" opened from remote end on peer connection "${this.peer.connectionId}"`, evt);

            this.inbound.onmessage = (evt: MessageEvent) => {
                this.peer.WriteLog(`Message on ${this.peer.connectionId}:${this.inbound.label}`, evt);

                this.onInboundMessage(evt);
            };
        };

        this.outbound = this.peer.peerConnection.createDataChannel(`${this.name}-channel:${this.peer.connectionId}`);

        this.outbound.onopen = (evt: Event) => {
            this.peer.WriteLog(`OUTBOUND DATA CHANNEL OPENED`, this.outbound.label);

            this.onOutboundOpen(evt);
        };

        this.outbound.onclose = (evt: Event) => {
            this.peer.WriteLog(`OUTBOUND DATA CHANNEL CLOSED`, this.outbound.label);

            this.onOutboundClose(evt);
        };
    }
}

export {
    DataChannel,
};
