import { Peer } from "./peer";

interface IPeerConstructor {
    /** Show logging on the console */
    logToConsole?: boolean;
}

interface IRemoteHandshake {
    /** UUID of the generating peer */
    fromId?: string;
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
