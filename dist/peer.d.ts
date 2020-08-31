import { IPeerConstructor, ISTUNServerDefinition } from "./interfaces";
import { DataChannel } from "./dataChannel";
/** Manages a WebRTC peer connection */
declare class Peer {
    /**
     * Initialize the connection object
     * @param options - Initialzation options
     * @throws If RTC support is not found
     */
    constructor({ logToConsole, defaultDataChannel }?: IPeerConstructor);
    /** Unique ID for this connection */
    connectionId: string;
    /** Unique ID for the remote host connection */
    remoteId: string;
    dataChannel: DataChannel;
    /** Internal list of generated handshakes */
    readonly generatedHandshakes: Array<string>;
    /** Write logging to the console */
    private logToConsole;
    /** Name to pass when (re)instantiating the initial data channel */
    private defaultDataChannelName;
    /**
     * STUN/TURN servers to use for ICE candidate negotiation
     *   - Initially set to a copy of the default server list, but can be overriden
     */
    iceServers: Array<ISTUNServerDefinition>;
    /** Called when a new handshake is generated */
    onGeneratedHandshake: () => void;
    /** The browser peer connection object */
    peerConnection: RTCPeerConnection;
    /** Expose the peer connection's onstatechanged event */
    peerConnection_onStateChanged: (evt: Event) => void;
    /** Initialize the RTCPeerConnection object, and assign existing data channels */
    private CreatePeerConnection;
    /**
     * Generate an answer to an RTC offer
     */
    private GenerateAnswer;
    /**
     * Generate an offer for RTC connections
     *   - Must be responded to with an **Answer** created by the other endpoint, and in response to this offer
     */
    private GenerateOffer;
    /** Create a new handshake object from either an RTCSessionDescriptionInit or RTCIceCandidate */
    private GenerateRemoteHandshake;
    /**
     * Check for a handshake message source that is not the expected host
     * @param handshake - Current handshake message to check
     */
    private InvalidSourceCheck;
    /**
     * Set the current local description, and pass that to handshake
     * @param description - The description generated from an offer, an answer, or an ice candidate
     */
    private SetDescription;
    /** Does the browser support RTC? */
    private RTCSupported;
    ConsumeHandshake(rawHandshake: string): Promise<void>;
    /**
     * Start a new connection process
     *   - Called by only the initiating browser, not both sides
     */
    InitiateConnection(): Promise<void>;
    /** Log any parameters to the console, if logToConsole == true */
    WriteLog(...args: any[]): void;
    /** Log any parameters as warnings */
    WriteWarning(...args: any[]): void;
    /**
     * Write exceptions to the console
     * @param err - The exception
     * @param note - Any details provided will be written with the exception
     */
    WriteError(err: Error, note?: string, ...args: any[]): void;
}
export { Peer, };
