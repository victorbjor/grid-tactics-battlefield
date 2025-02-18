from enum import Enum
from typing import Union
from pydantic import BaseModel, Field

### Order structure
class UnitName(BaseModel):
    name: str = Field(description="The name of the unit, given with two capital letters A to Z")


class Position(BaseModel):
    row: str = Field(description="The row of the position, given in a capital letter A to L")
    column: int = Field(description="The column of the position, given as a number 1 to 12")


class UnitID(BaseModel):
    id: UnitName


class MovementMethod(BaseModel):
    method: str = Field(description="The movement method - either 'safe' or 'fast'", pattern="^(safe|fast)$")


class Order(BaseModel):
    unit: UnitID
    target: Position
    method: MovementMethod


class Orders(BaseModel):
    orders: list[Order]


### Game State Data
class GamePosition(BaseModel):
    y: int
    x: int


class UnitType(BaseModel):
    id: str
    type: str  #= Field(pattern="^(friendly|enemy)$")
    target: GamePosition
    location: GamePosition
    health: int
    name: str
    moveSafely: bool


### WebSocket Messages
class MessageType(str, Enum):
    GAMESTATE = "gamestate"
    COMMAND = "command"


class GameStateMessage(BaseModel):
    units: list[UnitType]
    messages: list[str]


class CommandMessage(BaseModel):
    command: str


class WebSocketMessage(BaseModel):
    type: MessageType
    data: Union[GameStateMessage, CommandMessage]


class Score(BaseModel):
    name: str
    score: int


class FriendInfo(BaseModel):
    name: str = Field(..., description="Name of the unit. Always two capital letters")
    target_tile: str = Field(..., description="The target position of the unit in algebraic notation.")
    current_tile: str = Field(..., description="The current position of the unit in algebraic notation.")
    current_terrain: str = Field(..., description="The terrain type of the tile which the unit is currently on")
    target_terrain: str = Field(..., description="The terrain type of the tile which the unit is travelling towards")
    health: int = Field(..., description="Health of the unit, value between 0 and 100. If health reaches 0, the unit is dead.")
    movement_style: str = Field(..., description="Pathfinding mode for the unit, can either be safe or fast")

class EnemyInfo(BaseModel):
    current_tile: str = Field(..., description="The current position of the unit in algebraic notation.")
    current_terrain: str = Field(..., description="The terrain type of the tile which the unit is currently on")
    health: int = Field(..., description="Health of the unit, value between 0 and 100. If health reaches 0, the unit is dead.")
