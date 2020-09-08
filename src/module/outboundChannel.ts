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

    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    public onOpen: (evt: Event) => void = (evt: Event) => {};
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    public onClose: (evt: Event) => void = (evt: Event) => {};

    /** Send data to remote host */
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    public Send(dataToSend: any): void {
        this.dataChannel.send(dataToSend);
    }
}

export {
    OutboundChannel,
};
