import { Peer } from "./peer";
import { OutboundChannel } from "./outboundChannel";
import { InboundChannel } from "./inboundChannel";

/** RTC Data Channel */
class DataChannel {
    /**
     * @param peer - a reference to the peer object using this data channel
     */
    constructor(private readonly peer: Peer, public readonly defaultChannelName: string) {
        // Register an inbound data channel handler via an anonymous function (to keep "this" scope to the class)
        this.peer.peerConnection.ondatachannel = (evt: RTCDataChannelEvent) => { this.addInboundChannel(evt); };

        // Add the default channel
        this.AddOutboundChannel(defaultChannelName);
    }

    /** Incoming data channels */
    private inbound: Map<string, InboundChannel> = new Map();

    /** Data channels for outgoing messages */
    public outbound: Map<string, OutboundChannel> = new Map();

    /** Handler for the ondatachannel event of an RTCPeerConnection */
    private addInboundChannel(evt: RTCDataChannelEvent): void {
        const channel = evt.channel;

        this.peer.WriteLog(`NEW INCOMING DATA CHANNEL FOR ${this.peer.connectionId}`, channel.label, channel);

        if (!this.inbound.has(channel.label))
            this.inbound.set(channel.label, new InboundChannel(this.peer));

        // Add the channel to the InboundChannel
        this.inbound.get(channel.label).AddChannel(channel);

        // Clean up on channel close
        this.inbound.get(channel.label).onClose = () => {
            this.inbound.delete(channel.label);
        };
    }

    /**
     * Add a handler for a channel
     *   - *Channel may not exist yet*
     * @param channelName - Label used by the channel
     * @param handler
     */
    public AddInboundMessageHandler(channelName: string, handler: (evt: MessageEvent) => void): void {
        if (!this.inbound.has(channelName))
            this.inbound.set(channelName, new InboundChannel(this.peer));

        this.inbound.get(channelName).onInboundMessage = evt => handler(evt);
    }

    /** Add a new outbound channel for communicating to the remote peer */
    public AddOutboundChannel(channelName: string): void {
        // Check for the existence of a channel with that name
        const existingName = Array.from(this.outbound.keys()).find(key => (key == channelName));

        if (!!existingName) {
            const err = new Error();
            err.name = `Duplicate Channel`;
            err.message = `A data channel named "${channelName}" already exists`;
            throw err;
        }
        else
            this.outbound.set(channelName, new OutboundChannel(this.peer, channelName));
    }

    /**
     * Send data to the remote peer
     * @param dataToSend - Data to pass over the channel
     * @param channelName - Name of the channel to use
     *   - Defaults to the default channel name assigned in the constructor
     */
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    public Send(dataToSend: any, channelName: string = this.defaultChannelName): void {
        this.outbound.get(channelName).Send(dataToSend);
    }
}

export {
    DataChannel,
};
