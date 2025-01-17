from enum import Enum
from pprint import pprint
from typing import Union
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

### Order structure
class UnitName(BaseModel):
    name: str = Field(description="The name of the unit, given with two capital letters A to Z")

class Position(BaseModel):
    row: str = Field(description="The row of the position, given in a capital letter A to L")
    column: int = Field(description="The column of the position, given as a number 1 to 12")

class UnitID(BaseModel):
    id: UnitName | Position

class MovementMethod(BaseModel):
    method: str = Field(description="The movement method - either 'safe' or 'fast'", pattern="^(safe|fast)$")

class Order(BaseModel):
    unit: UnitID
    target: Position
    method: MovementMethod


### Game State Data
class GamePosition(BaseModel):
    y: int
    x: int

class UnitType(BaseModel):
    id: str
    type: str #= Field(pattern="^(friendly|enemy)$")
    target: GamePosition
    location: GamePosition
    ammo: int
    name: str
    moveSafely: bool

### WebSocket Messages
class MessageType(str, Enum):
    GAMESTATE = "gamestate"
    COMMAND = "command"

class WebSocketMessage(BaseModel):
    type: MessageType
    data: Union[list[UnitType], str]


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            raw_data = await websocket.receive_json()
            message = WebSocketMessage.model_validate(raw_data)
            
            if message.type == MessageType.GAMESTATE:
                game_state = message.data
                print('New game state received')
                pprint(game_state)
                continue
            elif message.type == MessageType.COMMAND:  # TEXT
                print(f"Received text message: {message.data}")
                response = WebSocketMessage(
                    type=MessageType.COMMAND,
                    data="Server received your message: " + message.data
                )
            else:
                raise ValueError(f"Unknown message type: {message.type}")
                
            await websocket.send_json(response.model_dump())
    except Exception as e:
        print(f"Error in websocket connection: {e}")



def issue_dummy_orders() -> Order:
    return Order(
        unit=UnitID(
            id=UnitName(name="BZ")
            ), 
        target=Position(row="A", column=1), 
        method=MovementMethod(method="safe"))


