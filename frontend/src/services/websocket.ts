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
    private readonly url: string = 'ws://localhost:8000/ws';

    connect() {
        if (!this.socket) {
            this.socket = new WebSocket(this.url);
            
            this.socket.onopen = () => {
                console.log('WebSocket Connected');
            };

            this.socket.onclose = () => {
                console.log('WebSocket Disconnected');
                this.socket = null;
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.connect(), 5000);
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket Error:', error);
            };
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
        if (n > 10) return; // Prevent infinite recursion
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

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

export const websocketService = new WebSocketService(); 