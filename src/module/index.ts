import { Peer } from "./peer.js";

function supportsRTC(): boolean {
    // Check for WebRTC support before proceeding
    if (!!window.RTCPeerConnection) {
        // eslint-disable-next-line no-console
        console.log(`WebRTC SUPPORTED`);

        return true;
    } else
        // eslint-disable-next-line no-console
        console.error(`NO WebRTC SUPPORT DETECTED`);

    return false;
}

function initiateRtcConnection(): Peer {
    if (supportsRTC()) {
        const connectToPeer: Peer = new Peer();

        return connectToPeer;
    } else
        throw new Error(`WebRTC is not supported`);
}

export {
    initiateRtcConnection as ConfigureRTCSession,
};
