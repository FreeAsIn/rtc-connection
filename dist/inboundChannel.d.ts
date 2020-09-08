import { Peer } from "./peer";
declare class InboundChannel {
    private readonly peer;
    constructor(peer: Peer);
    private dataChannel;
    /** Handler called for inbound message */
    onInboundMessage: (evt: MessageEvent) => void;
    /** Handler executes after the channel closes */
    onClose: (evt: Event) => void;
    /** Add the RTCDataChannel */
    AddChannel(dataChannel: RTCDataChannel): void;
}
export { InboundChannel, };
