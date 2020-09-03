import { OutboundChannel } from "./outboundChannel";
import { InboundChannel } from "./inboundChannel";
/** RTC Data Channel */
class DataChannel {
    /**
     * @param peer - a reference to the peer object using this data channel
     */
    constructor(peer, defaultChannelName) {
        this.peer = peer;
        this.defaultChannelName = defaultChannelName;
        /** Incoming data channels */
        this.inbound = new Map();
        /** Data channels for outgoing messages */
        this.outbound = new Map();
        // Register an inbound data channel handler via an anonymous function (to keep "this" scope to the class)
        this.peer.peerConnection.ondatachannel = (evt) => { this.addInboundChannel(evt); };
        // Add the default channel
        this.AddOutboundChannel(defaultChannelName);
    }
    addInboundChannel(evt) {
        const channel = evt.channel;
        this.peer.WriteLog(`NEW INCOMING DATA CHANNEL FOR ${this.peer.connectionId}`, channel.label, channel);
        if (!this.inbound.has(channel.label))
            this.inbound.set(channel.label, new InboundChannel(this.peer));
        // Add the channel
        this.inbound.get(channel.label).AddChannel(channel);
        // Clean up
        this.inbound.get(channel.label).onClose = () => {
            this.inbound.delete(channel.label);
        };
    }
    AddInboundMessageHandler(channelName, handler) {
        if (!this.inbound.has(channelName))
            this.inbound.set(channelName, new InboundChannel(this.peer));
        this.inbound.get(channelName).onInboundMessage = evt => handler(evt);
    }
    /** Add a new outbound channel for communicating to the remote peer */
    AddOutboundChannel(channelName) {
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
    Send(dataToSend, channelName = this.defaultChannelName) {
        this.outbound.get(channelName).Send(dataToSend);
    }
}
export { DataChannel, };
