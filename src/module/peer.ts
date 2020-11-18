// External modules
import { v4 as uuid } from "@freeasin/uuid";

import { IPeerConstructor, IRemoteHandshake, ISTUNServerDefinition } from "./interfaces";
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
    constructor({ logToConsole, defaultDataChannel }: IPeerConstructor = {}) {
        this.logToConsole = logToConsole ?? true;
        this.defaultDataChannelName = defaultDataChannel || `default`;

        // Check for RTC Support at instantiation
        if (this.RTCSupported()) {
            this.CreatePeerConnection();

            this.WriteLog(`Peer connection created`, this.connectionId);
        } else
            // If RTC is not supported, throw an error
            throw new Error(`WebRTC is not supported`);
    }

    //#region Private properties

    /** The assigned data channel */
    private _dataChannel: DataChannel;

    /** Name to pass when (re)instantiating the initial data channel */
    private defaultDataChannelName: string;

    /** Write logging to the console */
    private logToConsole: boolean;

    /** Assign the remote connection ID to a local variable */
    private _remoteConnectionId: string;

    /** Hold state change handlers for the peer connection */
    private peerConnectionStateChangeHandlers: Array<(evt: Event) => void> = [];

    //#endregion Private properties

    //#region Public accessors

    /** Communication with the remote via a data channel */
    public get dataChannel(): DataChannel { return this._dataChannel; }

    /** Unique ID for the remote host connection */
    public get remoteId(): string { return this._remoteConnectionId; }

    //#endregion Public accessors

    //#region Public properties

    /** Unique ID for this connection */
    public readonly connectionId: string = uuid();

    /** Internal list of generated ICE candidates to signal */
    public readonly generatedICECandidates: Array<string> = [];

    /**
     * STUN/TURN servers to use for ICE candidate negotiation
     *   - Initially set to a copy of the default server list, but can be overriden
     */
    public iceServers: Array<ISTUNServerDefinition> = ArrayUpdateProxy(this.CreatePeerConnection, stunServers.filter(() => true));

    /** Called when a new handshake is generated */
    public onGeneratedHandshake: (nextHandshake: string) => void;

    /** The browser peer connection object */
    public peerConnection: RTCPeerConnection;

    //#endregion Public properties

    //#region Private methods

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

        this._dataChannel = new DataChannel(this, this.defaultDataChannelName);
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

        // Immediately process a description
        if (!!description)
            this.onGeneratedHandshake(handshake);
        else
            // ICE candidates are added to an array for later use
            this.generatedICECandidates.push(handshake);
    }

    /**
     * Check for a handshake message source that is not the expected host
     * @param handshake - Current handshake message to check
     */
    private InvalidSourceCheck(handshake: IRemoteHandshake): void {
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
    private async SetDescription(description: RTCSessionDescriptionInit): Promise<void> {
        try {
            await this.peerConnection.setLocalDescription(description);
            this.WriteLog(`setLocalDescription`, this.peerConnection.localDescription);

            this.GenerateRemoteHandshake({ description });
        } catch (err) {
            this.WriteError(err, `setting local description`);
        }
    }

    /** Does the browser support RTC? */
    private RTCSupported(): boolean {
        if (!!window.RTCPeerConnection) {
            this.WriteLog(`WebRTC SUPPORTED`);

            return true;
        }

        return false;
    }

    /** Handle the peer connection's onstatechanged event */
    private peerConnection_onStateChanged(evt: Event): void {
        // Warn if no event handler is defined
        if (this.peerConnectionStateChangeHandlers.length == 0)
            this.WriteLog(`No event handler defined for onStateChanged for the peer connection`);

        this.peerConnectionStateChangeHandlers.forEach(handler => handler(evt));
    }

    //#endregion Private methods

    //#region Public methods

    public async ConsumeHandshake(rawHandshake: string): Promise<void> {
        const handshake: IRemoteHandshake = JSON.parse(rawHandshake);

        // Send the next ICE candidate to the consumer
        let processICECandidate = true;

        // Throw exception for attempt to use handshake generated by this Peer
        if (handshake.fromId == this.connectionId) {
            const err = new Error(`Peer connection can't process a handshake signal from itself`);
            err.name = `SAME ORIGIN HANDSHAKE`;
            throw err;
        }

        // Descriptions and ICE candidates are handled differently
        if (!!handshake.description) {
            // Confirm the ID source of the message
            if (!this.remoteId)
                this._remoteConnectionId = handshake.fromId;
            else
                this.InvalidSourceCheck(handshake);

            // Set the remote description for the connection
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(handshake.description));

            // Create an answer to respond to an offer
            if (handshake.description.type == `offer`) {
                // Don't send an ICE candidate as GenerateAnswer() sends the generated description
                processICECandidate = false;

                await this.GenerateAnswer();
            }
        } else if (!!handshake.iceCandidate) {
            this.InvalidSourceCheck(handshake);

            // Add the ICE Candidate to the connection
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(handshake.iceCandidate));
        }

        // If the ICE candidate list has more entries, send the next entry
        if (processICECandidate && (this.generatedICECandidates.length > 0))
            this.onGeneratedHandshake(this.generatedICECandidates.shift());
    }

    /**
     * Start a new connection process
     *   - Called by only the initiating browser, not both sides
     */
    public async InitiateConnection(): Promise<void> {
        await this.GenerateOffer();
    }

    /** Expose the peer connection's onstatechanged event */
    public onStateChanged(stateChangeHandler: (evt: Event) => void): void {
        this.peerConnectionStateChangeHandlers.push(stateChangeHandler);
    }

    /** Log any parameters to the console, if logToConsole == true */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public WriteLog(...args: any[]): void {
        if (this.logToConsole)
            // eslint-disable-next-line no-console
            console.log(args);
    }

    /** Log any parameters as warnings */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public WriteWarning(...args: any[]): void {
        // eslint-disable-next-line no-console
        console.log(args);
    }

    /**
     * Write exceptions to the console
     * @param err - The exception
     * @param note - Any details provided will be written with the exception
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public WriteError(err: Error, note?: string, ...args: any[]): void {
        let tag = `EXCEPTION`;

        if (!!note)
            tag += ` - ${note}`;

        // eslint-disable-next-line no-console
        console.error(tag, err, args);
    }

    //#endregion Public methods
}

export {
    Peer,
};
