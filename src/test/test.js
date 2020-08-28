import { HookUI } from "./ui-interaction.js";
import { ConfigurePeer, ConsumeRemoteHandshake, SendChatMessage, StartConnection } from "./peer-interaction.js";

function startApp() {
    HookUI({ StartConnection, ConsumeRemoteHandshake, SendChatMessage });

    ConfigurePeer();
}

startApp();
