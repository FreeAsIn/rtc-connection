import { Peer } from "./peer";

interface IPeerConstructor {
    /** Show logging on the console */
    logToConsole?: boolean;
}

interface IRemoteHandshake {
    /** The offer or answer generated */
    description?: RTCSessionDescriptionInit;
    /** The next ICE candidate */
    iceCandidate?: RTCIceCandidate;
}

interface ISTUNServerDefinition {
    /** Endpoint for STUN server */
    urls: string;
}

export {
    IPeerConstructor,
    IRemoteHandshake,
    ISTUNServerDefinition
};
