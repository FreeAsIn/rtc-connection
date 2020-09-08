# RTC Connection

A WebRTC peer connection module

## Caveats

+ Data channel only - **at the moment**
+ Handling signaling to create the connection is up to you.
Signaling values come from `Peer.onGeneratedHandshake(handshake)`.
    + The included test app provides signaling via in-page text boxes whose values can be shared with another host

## Getting Started

`npm install @freeasin/rtc-connection`

`import { Peer } from "@freeasin/rtc-connection;`

1. Turn off console logging with **logToConsole** in the constructor
    + `new Peer({ logToConsole: false })`
1. Set the default outbound channel name with **defaultDataChannel** in the constructor
    + `new Peer({ defaultDataChannel: "myChannel" })`
1. Add additional outbound channels with `Peer.dataChannel.AddOutboundChannel(channelName)`
1. On `Peer.onGeneratedHandshake(handshake)`, provide the handshake value to the opposite host
1. Provide a handler for inbound messages
    + `Peer.dataChannel.AddInboundMessageHandler(dataChannelLabel, (evt) => void)`
    + `evt.data` contains the message
1. Handle `Peer.dataChannel.outbound.get("CHANNEL_NAME").onOpen` to manage your application when a data channel opens between hosts
    + (evt) => {}
    + *evt.target* will be the channel
    + *channel.readyState* should be **"open"**
    + This is where the UX indicate connections between hosts now exists

## Included Example

1. Run the test app
```
npm run test
```
1. Go to http://localhost:8080
1. Click the **Add Peer Connection** button at the bottom
    + You now have two idential sections on the page
1. Click one of the **Generate Offer** buttons
    + The handshake signal shown is automatically copied to the clipboard
1. Paste into **the other** *Consume Offer* box, and click the *Consume Offer* button
    + You'll get an alert if you try to paste a handshake signal into the same section that generates it
1. Continue pasting/clicking back-and-forth until the two peer connections agree on how to connect
1. Once the connection is negotiated, the UI changes to "Send" boxes, and you have a peer-to-peer messaging app
    + The typing notification is sent over a different data channel from the messages

**Try the same example in two different browser tabs instead of two connections on one page**

**This also works over different devices locally, or over the Internet, as long as you can exchange the handshake signaling data**
