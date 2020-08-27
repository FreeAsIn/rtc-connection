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

export {
    supportsRTC as RTCAvailable,
    Peer,
};
