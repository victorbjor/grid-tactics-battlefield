import { GameState, UnitType } from "../types/game";

type CommandMessage = {
    type: "command";
    data: string;
}

type GameStateMessage = {
    type: "gamestate";
    data: UnitType[];
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

    subscribe(callback: (data: any) => void) {
        if (this.socket) {
            this.socket.onmessage = (event) => {
                callback(event.data);
            };
        }
    }

    sendCommand(command: string) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(
                {type: "command", data: command} as CommandMessage
            ));
        }
    }

    sendGameState(gameState: GameState) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const unitList = Object.values(gameState.units);
            console.log(unitList);
            this.socket.send(JSON.stringify(
                {type: "gamestate", data: unitList} as GameStateMessage
            ));
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