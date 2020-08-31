// External modules
import { v4 as uuid } from "@freeasin/uuid";
import { defaultServers as stunServers } from "./defaultSTUN";
import { DataChannel } from "./dataChannel";
import { ArrayUpdateProxy } from "./arrayUpdates";
/** Manages a WebRTC peer connection */
class Peer {
    /**
     * Initialize the connection object
     * @param options - Initialzation options
     * @throws If RTC support is not found
     */
    constructor({ logToConsole, defaultDataChannel } = {}) {
        // Private properties
        /** Unique ID for this connection */
        this.connectionId = uuid();
        /** Internal list of generated handshakes */
        this.generatedHandshakes = ArrayUpdateProxy(() => { if (!!this.onGeneratedHandshake)
            this.onGeneratedHandshake(); });
        // Public properties
        /**
         * STUN/TURN servers to use for ICE candidate negotiation
         *   - Initially set to a copy of the default server list, but can be overriden
         */
        this.iceServers = ArrayUpdateProxy(this.CreatePeerConnection, stunServers.filter(() => true));
        this.logToConsole = logToConsole || true;
        this.defaultDataChannelName = defaultDataChannel || `default`;
        // Check for RTC Support at instantiation
        if (this.RTCSupported()) {
            this.CreatePeerConnection();
            // Add a placeholder for the onstatechanged event of the peer connection
            this.peerConnection_onStateChanged = () => { this.WriteLog(`onStateChanged for the peer connection hasn't been defined`); };
            this.WriteLog(`Peer connection created`, this.connectionId);
        }
        else
            // If RTC is not supported, throw an error
            throw new Error(`WebRTC is not supported`);
    }
    // Private methods
    /** Initialize the RTCPeerConnection object, and assign existing data channels */
    CreatePeerConnection() {
        // Set the configuration to the assigned ICE servers
        const configuration = !!this.iceServers ? { iceServers: this.iceServers } : null;
        // Create a new peer connection from the configuration
        this.peerConnection = new RTCPeerConnection(configuration);
        // Assign a handler for the ICE candidates
        this.peerConnection.onicecandidate = (iceEvent) => {
            this.WriteLog(`ICE Candidate received`, iceEvent);
            // Always generate a handshake, leaving the handler to handle end-of-candidates NULL
            this.GenerateRemoteHandshake({ iceCandidate: !!iceEvent ? iceEvent.candidate : null });
        };
        // Assign a handler for the connection state changes
        this.peerConnection.onconnectionstatechange = (connectionStateChangeEvent) => {
            this.WriteLog(`Connection state changed`, connectionStateChangeEvent);
            this.peerConnection_onStateChanged(connectionStateChangeEvent);
        };
        this.dataChannel = new DataChannel(this, this.defaultDataChannelName);
    }
    /**
     * Generate an answer to an RTC offer
     */
    async GenerateAnswer() {
        try {
            const answer = await this.peerConnection.createAnswer();
            this.WriteLog(`Answer to offer created`, answer);
            await this.SetDescription(answer);
        }
        catch (err) {
            this.WriteError(err, `Creating Answer`);
        }
    }
    /**
     * Generate an offer for RTC connections
     *   - Must be responded to with an **Answer** created by the other endpoint, and in response to this offer
     */
    async GenerateOffer() {
        try {
            const offer = await this.peerConnection.createOffer();
            this.WriteLog(`Offer created`, offer);
            await this.SetDescription(offer);
        }
        catch (err) {
            this.WriteError(err, `Creating Offer`);
        }
    }
    /** Create a new handshake object from either an RTCSessionDescriptionInit or RTCIceCandidate */
    GenerateRemoteHandshake({ description, iceCandidate }) {
        // Log the parameters
        this.WriteLog(`Handshake generation`, { connection: this.connectionId, description, iceCandidate });
        const handshake = JSON.stringify({ fromId: this.connectionId, description, iceCandidate });
        // Add to the list of handshakes to use
        this.generatedHandshakes.push(handshake);
    }
    /**
     * Check for a handshake message source that is not the expected host
     * @param handshake - Current handshake message to check
     */
    InvalidSourceCheck(handshake) {
        if (this.remoteId !== handshake.fromId) {
            // Error on invalid message source
            const err = new Error(`From ID "${handshake.fromId}" does not match connection remote ID (${this.remoteId})`);
            err.name = `INVALID HANDSHAKE SOURCE`;
            throw err;
        }
    }
    /**
     * Set the current local description, and pass that to handshake
     * @param description - The description generated from an offer, an answer, or an ice candidate
     */
    async SetDescription(description) {
        try {
            await this.peerConnection.setLocalDescription(description);
            this.WriteLog(`setLocalDescription`, this.peerConnection.localDescription);
            this.GenerateRemoteHandshake({ description });
        }
        catch (err) {
            this.WriteError(err, `setting local description`);
        }
    }
    /** Does the browser support RTC? */
    RTCSupported() {
        if (!!window.RTCPeerConnection) {
            this.WriteLog(`WebRTC SUPPORTED`);
            return true;
        }
        return false;
    }
    // Public methods
    async ConsumeHandshake(rawHandshake) {
        const handshake = JSON.parse(rawHandshake);
        // Throw exception for attempt to use handshake generated by this Peer
        if (handshake.fromId == this.connectionId)
            throw new Error(`Peer connection can't process a handshake signal from itself`);
        // Descriptions and ICE candidates are handled differently
        if (!!handshake.description) {
            // Confirm the ID source of the message
            if (!this.remoteId)
                this.remoteId = handshake.fromId;
            else
                this.InvalidSourceCheck(handshake);
            // Set the remote description for the connection
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(handshake.description));
            // Create an answer to respond to an offer
            if (handshake.description.type == `offer`)
                await this.GenerateAnswer();
        }
        else if (!!handshake.iceCandidate) {
            this.InvalidSourceCheck(handshake);
            // Add the ICE Candidate to the connection
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(handshake.iceCandidate));
        }
    }
    /**
     * Start a new connection process
     *   - Called by only the initiating browser, not both sides
     */
    async InitiateConnection() {
        await this.GenerateOffer();
    }
    /** Log any parameters to the console, if logToConsole == true */
    WriteLog(...args) {
        if (this.logToConsole)
            // eslint-disable-next-line no-console
            console.log(args);
    }
    /** Log any parameters as warnings */
    WriteWarning(...args) {
        // eslint-disable-next-line no-console
        console.log(args);
    }
    /**
     * Write exceptions to the console
     * @param err - The exception
     * @param note - Any details provided will be written with the exception
     */
    WriteError(err, note, ...args) {
        let tag = `EXCEPTION`;
        if (!!note)
            tag += ` - ${note}`;
        // eslint-disable-next-line no-console
        console.error(tag, err, args);
    }
}
export { Peer, };
