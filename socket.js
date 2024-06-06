const socket = io();

const peer = new Peer({
    host: "localhost",
    port: 51470,
    path: "/server/peerserver",
});

peer.on('error', (err) => {
    console.error(err)
})