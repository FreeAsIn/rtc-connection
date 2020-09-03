import { Peer } from "./peer";
declare class InboundChannel {
    private readonly peer;
    constructor(peer: Peer);
    private dataChannel;
    /** Handler called for inbound message */
    onInboundMessage: (evt: MessageEvent) => void;
    onClose: (evt: Event) => void;
    AddChannel(dataChannel: RTCDataChannel): void;
}
export { InboundChannel, };
