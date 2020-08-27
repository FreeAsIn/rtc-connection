// External modules
import { v4 as uuid } from "@freeasin/uuid";

import { IPeerConstructor, IRemoteHandshake, ISTUNServerDefinition } from "./interfaces";
import { defaultServers as stunServers } from "./defaultSTUN";

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
    }

    // Private properties

    /** Unique ID for this connection */
    private connectionId: string = uuid();

    /** Write logging to the console */
    private logToConsole: boolean;

    // Public properties

    public generatedHandshakes: Array<string> = new Proxy([], {
        get: (target, property) => {
            console.log("getting", {target, property});

            return target[property];
        },
        set: (target, property, value, receiver) => {
            console.log("setting", { target, property, value, receiver });

            target[property] = value;

            if (!!this.onGeneratedHandshake)
                this.onGeneratedHandshake(this.generatedHandshakes);

            return true;
        }
    });

    /**
     * STUN/TURN servers to use for ICE candidate negotiation
     *   - Initially set to a copy of the default server list, but can be overriden
     */
    public iceServers: Array<ISTUNServerDefinition> = stunServers.filter(() => true);

    public onGeneratedHandshake: (handshakesAvailable: Array<string>) => void;

    /** The browser peer connection object */
    public peerConnection: RTCPeerConnection;

    /** Expose the peer connection's onstatechanged event */
    public peerConnection_onStateChanged: (evt: Event) => void;

    // Private methods

    private GenerateRemoteHandshake({ description, iceCandidate }: IRemoteHandshake): void {
        // Log the parameters
        this.WriteLog(`Handshake generation`, { connection: this.connectionId, description, iceCandidate });

        const handshake = JSON.stringify({ fromId: this.connectionId, description, iceCandidate });

        // Add to the list of handshakes to use
        this.generatedHandshakes.push(handshake);
    }

    // Public methods

    /** Initialize the RTCPeerConnection object, and assign existing data channels */
    public GenerateConnection(): void {
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

        // ADD PRE-DEFINED DATA CHANNELS
        this.WriteWarning(`Pre-defined data channels need to be added`);
    }

    public async GenerateOffer(): Promise<void> {
        try {
            const offer = await this.peerConnection.createOffer();
            this.WriteLog(`Offer created`, offer);
            await this.GenerateDescription(offer);
        } catch (err) {
            this.WriteError(err, `Creating Offer`);
        }
    }

    public async GenerateDescription(description: RTCSessionDescriptionInit): Promise<void> {
        try {
            await this.peerConnection.setLocalDescription(description);
            this.WriteLog(`setLocalDescription`, this.peerConnection.localDescription);

            this.GenerateRemoteHandshake({ description });
        } catch (err) {
            this.WriteError(err, `setting local description`);
        }
    }

    /** Called by the peer initiating the connection process */
    public async InitiateConnection(): Promise<void> {
        this.GenerateConnection();

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
