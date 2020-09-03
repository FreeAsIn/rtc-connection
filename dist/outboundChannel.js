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
export { OutboundChannel, };
