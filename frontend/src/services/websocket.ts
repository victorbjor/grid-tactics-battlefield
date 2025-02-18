import { GameState, UnitType } from "../types/game";

type CommandMessage = {
    type: "command";
    data: {command: string};
}

type GameStateMessage = {
    type: "gamestate";
    data: {units: UnitType[], messages: string[]};
}

type WebSocketMessage = CommandMessage | GameStateMessage;

class WebSocketService {
    private socket: WebSocket | null = null;
    private readonly url: string = 'wss://grid-tactics-backend.onrender.com/ws';
    private _connected: boolean = false;
    private listeners: Set<(connected: boolean) => void> = new Set();

    get connected() {
        return this._connected;
    }

    private set connected(value: boolean) {
        if (this._connected !== value) {
            this._connected = value;
            this.notifyListeners();
        }
    }

    private notifyListeners() {
        this.listeners.forEach(callback => callback(this._connected));
    }

    subscribeToConnection(callback: (connected: boolean) => void) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback); // Return unsubscribe function
    }

    connect() {
        if (!this.socket) {
            this.socket = new WebSocket(this.url);
            
            this.socket.onopen = () => {
                console.log('WebSocket Connected');
                this.connected = true;
            };

            this.socket.onclose = () => {
                console.log('WebSocket Disconnected');
                this.socket = null;
                this.connected = false;
                setTimeout(() => this.connect(), 5000);
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket Error:', error);
                this.connected = false;
            };
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    subscribe(callback: (data: unknown) => void) {
        if (this.socket) {
            this.socket.onmessage = (event) => {
                callback(event.data);
            };
        }
    }

    sendCommand(command: string) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(
                {type: "command", data: {command}} as CommandMessage
            ));
        }
    }

    sendGameState(gameState: GameState, n=0) {
        if (n > 120) return; // Prevent infinite recursion
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const unitList = Object.values(gameState.units);
            this.socket.send(JSON.stringify(
                {type: "gamestate", data: {units: unitList, messages: gameState.messages}} as GameStateMessage
            ));
        } else {
            console.log('WebSocket is not open. Retrying...');
            // Attempt to resend the game state after 1 second
            setTimeout(() => this.sendGameState(gameState), 1000);
            
        }
    }
}

export const websocketService = new WebSocketService(); 