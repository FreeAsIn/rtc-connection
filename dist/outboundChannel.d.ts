import { Peer } from "./peer";
declare class OutboundChannel {
    readonly channelName: string;
    constructor(peer: Peer, channelName?: string);
    private dataChannel;
    onOpen: (evt: Event) => void;
    onClose: (evt: Event) => void;
    Send(dataToSend: any): void;
}
export { OutboundChannel, };
