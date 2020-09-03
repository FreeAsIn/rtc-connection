import { Peer } from "./peer";
import { OutboundChannel } from "./outboundChannel";
/** RTC Data Channel */
declare class DataChannel {
    private readonly peer;
    readonly defaultChannelName: any;
    /**
     * @param peer - a reference to the peer object using this data channel
     */
    constructor(peer: Peer, defaultChannelName: any);
    /** Incoming data channels */
    inbound: Array<RTCDataChannel>;
    /** Handler called for inbound message */
    onInboundMessage: (channel: RTCDataChannel, evt: MessageEvent) => void;
    /** Data channels for outgoing messages */
    outbound: Map<string, OutboundChannel>;
    private addInboundChannel;
    /** Add a new outbound channel for communicating to the remote peer */
    AddOutboundChannel(channelName: string): void;
    /**
     * Send data to the remote peer
     * @param dataToSend - Data to pass over the channel
     * @param channelName - Name of the channel to use
     *   - Defaults to the default channel name assigned in the constructor
     */
    Send(dataToSend: any, channelName?: string): void;
}
export { DataChannel, };
