import { Peer } from "./peer";

/** RTC Data Channel */
class DataChannel {
    /**
     * @param peer - a reference to the peer object using this data channel
     */
    constructor(private readonly peer: Peer, public readonly defaultChannelName = `default`) {
        // Default handlers do nothing
        this.onInboundMessage = (channel, evt) => { this.peer.WriteError(new Error(`Inbound message received: No onInboundMessage handler defined for data channel`), null, evt); };

        // Register an inbound data channel handler via an anonymous function (to keep "this" scope to the class)
        this.peer.peerConnection.ondatachannel = (evt: RTCDataChannelEvent) => { this.addInboundChannel(evt); };

        // Add the default channel
        this.AddOutboundChannel(defaultChannelName);
    }

    /** Incoming data channels */
    public inbound: Array<RTCDataChannel> = [];

    /** Handler called for inbound message */
    public onInboundMessage: (channel: RTCDataChannel, evt: MessageEvent) => void;

    /** Data channels for outgoing messages */
    public outbound: Map<string, OutboundChannel> = new Map();

    private addInboundChannel(evt: RTCDataChannelEvent): void {
        let channel = evt.channel;

        this.inbound.push(channel);

        this.peer.WriteLog(`NEW INCOMING DATA CHANNEL FOR ${this.peer.connectionId}`, channel.label, channel);

        channel.onmessage = (evt: MessageEvent) => {
            this.peer.WriteLog(`MESSAGE RECEIVED`, this.peer.connectionId, channel.label, evt);

            this.onInboundMessage(channel, evt);
        };

        channel.onclose = (evt: Event) => {
            // Remove the channel from the array
            this.inbound.splice(this.inbound.findIndex(c => (c.id == channel.id)), 1);

            this.peer.WriteLog(`INCOMING DATA CHANNEL CLOSED`, this.peer.connectionId, channel);

            channel = null;
        };
    }

    /** Add a new outbound channel for communicating to the remote peer */
    public AddOutboundChannel(channelName: string): void {
        this.outbound.set(channelName, new OutboundChannel(this.peer, channelName));
    }

    /**
     * Send data to the remote peer
     * @param dataToSend - Data to pass over the channel
     * @param channelName - Name of the channel to use
     *   - Defaults to the default channel name assigned in the constructor
     */
    public Send(dataToSend: any, channelName: string = this.defaultChannelName): void {
        this.outbound.get(channelName).Send(dataToSend);
    }
}

class OutboundChannel {
    constructor(peer: Peer, public readonly channelName = `default`) {
        this.dataChannel = peer.peerConnection.createDataChannel(`${channelName}-channel:${peer.connectionId}`);

        this.dataChannel.onopen = (evt: Event) => {
            peer.WriteLog(`OUTBOUND DATA CHANNEL OPENED`, this.dataChannel.label);

            this.onOpen(evt);
        };

        this.dataChannel.onclose = (evt:Event) => {
            peer.WriteLog(`OUTBOUND DATA CHANNEL CLOSED`, this.dataChannel.label);

            this.onClose(evt);
        };
    }

    private dataChannel: RTCDataChannel;

    public onOpen: (evt: Event) => void = (evt: Event) => {};
    public onClose: (evt: Event) => void = (evt: Event) => {};

    public Send(dataToSend: any) {
        this.dataChannel.send(dataToSend);
    }
}

export {
    DataChannel,
};
