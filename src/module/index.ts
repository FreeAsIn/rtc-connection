import { Peer } from "./peer.js";

/** Does the browser support RTC? */
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

/** Start the process of configuring an RTC session */
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
