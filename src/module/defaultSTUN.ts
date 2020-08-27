import { ISTUNServerDefinition } from "./interfaces";

/** List of default STUN/TURN servers to use */
const defaultServers: Array<ISTUNServerDefinition> = [
    { urls: "stun:stun.l.google.com:19302" },
];

export {
    defaultServers,
};
