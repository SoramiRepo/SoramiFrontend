import config from "../config";

let ws;
let messageHandler = null;

export function connectWS() {
    const token = localStorage.getItem('token');
    if (!token) return;

    ws = new WebSocket(`ws://${config.apiBaseUrl}/?token=${token}`);

    ws.onopen = () => {
        console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'new_message' && messageHandler) {
                messageHandler(msg.data);
            }
        } catch (err) {
            console.error('Invalid WS message:', event.data);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket closed, retrying in 3s...');
        setTimeout(connectWS, 3000);
    };
}

export function onNewMessage(callback) {
    messageHandler = callback;
}

export function sendWSMessage(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }
}
