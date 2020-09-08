import { ISTUNServerDefinition } from "./interfaces";

/**
 * List of default STUN/TURN servers to use
 *   - Defaults to using Google's public STUN
 */
const defaultServers: Array<ISTUNServerDefinition> = [
    { urls: `stun:stun.l.google.com:19302` },
];

export {
    defaultServers,
};
