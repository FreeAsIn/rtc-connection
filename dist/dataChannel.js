/** RTC Data Channel */
class DataChannel {
    /**
     * @param peer - a reference to the peer object using this data channel
     */
    constructor(peer, defaultChannelName) {
        this.peer = peer;
        this.defaultChannelName = defaultChannelName;
        /** Incoming data channels */
        this.inbound = [];
        /** Data channels for outgoing messages */
        this.outbound = new Map();
        // Default handlers do nothing
        this.onInboundMessage = (channel, evt) => { this.peer.WriteError(new Error(`Inbound message received: No onInboundMessage handler defined for data channel`), null, evt); };
        // Register an inbound data channel handler via an anonymous function (to keep "this" scope to the class)
        this.peer.peerConnection.ondatachannel = (evt) => { this.addInboundChannel(evt); };
        // Add the default channel
        this.AddOutboundChannel(defaultChannelName);
    }
    addInboundChannel(evt) {
        let channel = evt.channel;
        this.inbound.push(channel);
        this.peer.WriteLog(`NEW INCOMING DATA CHANNEL FOR ${this.peer.connectionId}`, channel.label, channel);
        channel.onmessage = (evt) => {
            this.peer.WriteLog(`MESSAGE RECEIVED`, this.peer.connectionId, channel.label, evt);
            this.onInboundMessage(channel, evt);
        };
        channel.onclose = (evt) => {
            // Remove the channel from the array
            this.inbound.splice(this.inbound.findIndex(c => (c.id == channel.id)), 1);
            this.peer.WriteLog(`INCOMING DATA CHANNEL CLOSED`, this.peer.connectionId, channel);
            channel = null;
        };
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
class OutboundChannel {
    constructor(peer, channelName = `default`) {
        this.channelName = channelName;
        this.onOpen = (evt) => { };
        this.onClose = (evt) => { };
        this.dataChannel = peer.peerConnection.createDataChannel(`${channelName}`);
        this.dataChannel.onopen = (evt) => {
            peer.WriteLog(`OUTBOUND DATA CHANNEL OPENED`, this.dataChannel.label);
            this.onOpen(evt);
        };
        this.dataChannel.onclose = (evt) => {
            peer.WriteLog(`OUTBOUND DATA CHANNEL CLOSED`, this.dataChannel.label);
            this.onClose(evt);
        };
    }
    Send(dataToSend) {
        this.dataChannel.send(dataToSend);
    }
}
export { DataChannel, };
