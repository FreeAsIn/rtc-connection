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
    constructor({ logToConsole }: IPeerConstructor) {
        this.connectionId = uuid();
        this.logToConsole = logToConsole || true;

        // Set the initial ICE list to the default STUN servers
        this.iceServers = stunServers.filter(() => true);

        // As a handshake implementation is required, default the handshake to an error message
        this.remoteHandshake = () => { this.writeError(new Error(`No remoteHandshake defined for peer (id: ${this.connectionId})`)); };

        // Add a placeholder for the onstatechanged event of the peer connection
        this.peerConnection_onStateChanged = () => { this.writeLog(`onStateChanged for the peer connection hasn't been defined`); };
    }

    // Private properties

    /** Unique ID for this connection */
    private connectionId: string;

    /** Write logging to the console */
    private logToConsole: boolean;

    // Public properties

    /** STUN/TURN servers to use for ICE candidate negotiation */
    public iceServers: Array<ISTUNServerDefinition>;

    public remoteHandshake: (params: IRemoteHandshake) => void;

    /** Expose the peer connection's onstatechanged event */
    public peerConnection_onStateChanged: (evt: Event) => void;

    // Private methods

    /** Log any parameters to the console, if logToConsole == true */
    public writeLog(...args: any[]): void {
        if (this.logToConsole)
            // eslint-disable-next-line no-console
            console.log(args);
    }

    /** Log any parameters as warnings */
    public writeWarning(...args: any[]): void {
        // eslint-disable-next-line no-console
        console.log(args);
    }

    /**
     * Write exceptions to the console
     * @param err - The exception
     * @param note - Any details provided will be written with the exception
     */
    public writeError(err: Error, note?: string, ...args: any[]): void {
        let tag = `EXCEPTION`;

        if (!!note)
            tag += ` - ${note}`;

        // eslint-disable-next-line no-console
        console.error(tag, err, args);
    }


    // Public methods
}

export {
    Peer,
};
