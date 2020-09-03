import { Peer } from "./peer";

class OutboundChannel {
    constructor(peer: Peer, public readonly channelName = `default`) {
        this.dataChannel = peer.peerConnection.createDataChannel(`${channelName}`);

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
    OutboundChannel,
};
