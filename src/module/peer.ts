// External modules
import { v4 as uuid } from "@freeasin/uuid";

import { IPeerConstructor, IRemoteHandshake, ISTUNServerDefinition } from "./interfaces";
import { defaultServers as stunServers } from "./defaultSTUN";
import { DataChannel } from "./dataChannel";

/** Manages a WebRTC peer connection */
class Peer {
    /**
     * Initialize the connection object
     * @param options - Initialzation options
     */
    constructor({ logToConsole }: IPeerConstructor = {}) {
        this.logToConsole = logToConsole || true;

        // Add a placeholder for the onstatechanged event of the peer connection
        this.peerConnection_onStateChanged = () => { this.WriteLog(`onStateChanged for the peer connection hasn't been defined`); };

        this.WriteLog(`Peer connection created`, this.connectionId);
    }

    // Private properties

    /** Unique ID for this connection */
    public connectionId: string = uuid();

    public dataChannel: DataChannel;

    /** Internal list of generated handshakes */
    public generatedHandshakes: Array<string> = new Proxy([], {
        get: (target, property) => {
            return target[property];
        },
        set: (target, property, value, receiver) => {
            target[property] = value;

            // Run handler after length change as array length is updated after addition of element
            if ((property == `length`) && !!this.onGeneratedHandshake)
                this.onGeneratedHandshake();

            return true;
        }
    });

    /** Write logging to the console */
    private logToConsole: boolean;

    // Public properties

    /**
     * STUN/TURN servers to use for ICE candidate negotiation
     *   - Initially set to a copy of the default server list, but can be overriden
     */
    public iceServers: Array<ISTUNServerDefinition> = stunServers.filter(() => true);

    /** Called when a new handshake is generated */
    public onGeneratedHandshake: () => void;

    /** The browser peer connection object */
    public peerConnection: RTCPeerConnection;

    /** Expose the peer connection's onstatechanged event */
    public peerConnection_onStateChanged: (evt: Event) => void;

    // Private methods

    /** Initialize the RTCPeerConnection object, and assign existing data channels */
    private CreatePeerConnection(): void {
        // Set the configuration to the assigned ICE servers
        const configuration: RTCConfiguration = !!this.iceServers ? { iceServers: this.iceServers } : null;

        // Create a new peer connection from the configuration
        this.peerConnection = new RTCPeerConnection(configuration);

        // Assign a handler for the ICE candidates
        this.peerConnection.onicecandidate = (iceEvent: RTCPeerConnectionIceEvent) => {
            this.WriteLog(`ICE Candidate received`, iceEvent);

            // Always generate a handshake, leaving the handler to handle end-of-candidates NULL
            this.GenerateRemoteHandshake({ iceCandidate: !!iceEvent ? iceEvent.candidate : null });
        };

        // Assign a handler for the connection state changes
        this.peerConnection.onconnectionstatechange = (connectionStateChangeEvent: Event) => {
            this.WriteLog(`Connection state changed`, connectionStateChangeEvent);

            this.peerConnection_onStateChanged(connectionStateChangeEvent);
        };

        this.dataChannel = new DataChannel(this);
    }

    /**
     * Generate an answer to an RTC offer
     */
    private async GenerateAnswer(): Promise<void> {
        try {
            const answer = await this.peerConnection.createAnswer();

            this.WriteLog(`Answer to offer created`, answer);

            await this.SetDescription(answer);
        } catch (err) {
            this.WriteError(err, `Creating Answer`);
        }
    }

    /**
     * Generate an offer for RTC connections
     *   - Must be responded to with an **Answer** created by the other endpoint, and in response to this offer
     */
    private async GenerateOffer(): Promise<void> {
        try {
            const offer = await this.peerConnection.createOffer();

            this.WriteLog(`Offer created`, offer);

            await this.SetDescription(offer);
        } catch (err) {
            this.WriteError(err, `Creating Offer`);
        }
    }

    /** Create a new handshake object from either an RTCSessionDescriptionInit or RTCIceCandidate */
    private GenerateRemoteHandshake({ description, iceCandidate }: IRemoteHandshake): void {
        // Log the parameters
        this.WriteLog(`Handshake generation`, { connection: this.connectionId, description, iceCandidate });

        const handshake = JSON.stringify({ fromId: this.connectionId, description, iceCandidate });

        // Add to the list of handshakes to use
        this.generatedHandshakes.push(handshake);
    }

    /**
     * Set the current local description, and pass that to handshake
     * @param description - The description generated from an offer, an answer, or an ice candidate
     */
    private async SetDescription(description: RTCSessionDescriptionInit): Promise<void> {
        try {
            await this.peerConnection.setLocalDescription(description);
            this.WriteLog(`setLocalDescription`, this.peerConnection.localDescription);

            this.GenerateRemoteHandshake({ description });
        } catch (err) {
            this.WriteError(err, `setting local description`);
        }
    }

    // Public methods

    public async ConsumeHandshake(rawHandshake: string): Promise<void> {
        const handshake: IRemoteHandshake = JSON.parse(rawHandshake);

        // Throw exception for attempt to use handshake generated by this Peer
        if (handshake.fromId == this.connectionId)
            throw new Error(`Peer connection can't process a handshake signal from itself`);

        // Create the RTCPeerConnection object if it doesn't already exist
        if (!this.peerConnection)
            this.CreatePeerConnection();

        // Descriptions and ICE candidates are handled differently
        if (!!handshake.description) {
            // Set the remote description for the connection
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(handshake.description));

            // Create an answer to respond to an offer
            if (handshake.description.type == `offer`)
                await this.GenerateAnswer();
        } else if (!!handshake.iceCandidate)
            // Add the ICE Candidate to the connection
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(handshake.iceCandidate));
    }

    /**
     * Start a new connection process
     *   - Called by only the initiating browser, not both sides
     */
    public async InitiateConnection(): Promise<void> {
        this.CreatePeerConnection();

        await this.GenerateOffer();
    }

    /** Log any parameters to the console, if logToConsole == true */
    public WriteLog(...args: any[]): void {
        if (this.logToConsole)
            // eslint-disable-next-line no-console
            console.log(args);
    }

    /** Log any parameters as warnings */
    public WriteWarning(...args: any[]): void {
        // eslint-disable-next-line no-console
        console.log(args);
    }

    /**
     * Write exceptions to the console
     * @param err - The exception
     * @param note - Any details provided will be written with the exception
     */
    public WriteError(err: Error, note?: string, ...args: any[]): void {
        let tag = `EXCEPTION`;

        if (!!note)
            tag += ` - ${note}`;

        // eslint-disable-next-line no-console
        console.error(tag, err, args);
    }
}

export {
    Peer,
};
