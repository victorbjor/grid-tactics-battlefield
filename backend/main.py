import os
import json
import pickle
from pprint import pprint
from typing import List, Dict

from fastapi import FastAPI, WebSocket, Response
from fastapi.middleware.cors import CORSMiddleware
from upstash_redis import Redis

from custom_types import GameStateMessage, MessageType, MovementMethod, Order, Position, Score, UnitID, UnitName, WebSocketMessage, UnitType
from decision_layer import call_order_layer

REDIS_KEY = os.getenv("UPSTASH_REDIS_REST_TOKEN")

if REDIS_KEY is None:
    raise ValueError("UPSTASH_REDIS_REST_TOKEN environment variable is not set.")

REDIS_URL = os.getenv("UPSTASH_REDIS_REST_URL")

if REDIS_URL is None:
    raise ValueError("UPSTASH_REDIS_REST_URL environment variable is not set.")

LEADERBOARD_KEY = "leaderboard"

redis = Redis(url=REDIS_URL, token=REDIS_KEY)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def format_models_json(models):
    return json.dumps([model.dict() for model in models], indent=4)

def format_models(models):
    header = "Model | Fields\n" + "-" * 40
    rows = [
        f"{model.__class__.__name__} | {', '.join(f'{k}={v}' for k, v in model.dict().items())}"
        for model in models
    ]
    return "\n".join([header] + rows)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        last_command = []
        last_game_state = None
        while True:
            raw_data = await websocket.receive_json()
            message: WebSocketMessage = WebSocketMessage.model_validate(raw_data)

            if message.type == MessageType.GAMESTATE:
                game_state: GameStateMessage = message.data # type: ignore
                last_game_state = game_state
                print('Game State Check!')
            elif message.type == MessageType.COMMAND:
                command_message: CommandMessage = message.data # type: ignore
                last_command.append(command_message.command)
                print('Last command:', last_command)
            else:
                raise ValueError(f"Unknown message type: {message.type}")

            if (len(last_command) > 0) and (last_game_state is not None):
                new_orders = await call_order_layer(last_game_state, last_command)
                print('New orders:', new_orders)
                if (new_orders is not None):
                    await websocket.send_json(new_orders.model_dump())
    except Exception as e:
        print(f"Error in websocket connection: {e}")


@app.get('/leaderboard', response_model=List[Score])
async def get_leaderboard() -> List[Score]:
    data = await redis.get(LEADERBOARD_KEY)
    if not data:
        return []
    return json.loads(data)[:10]


@app.post('/leaderboard', response_model=List[Dict])
async def post_leaderboard(new_score: Score) -> List[Dict]:
    print(new_score)
    leaderboard = await get_leaderboard()
    
    leaderboard.append(new_score.model_dump())
    leaderboard.sort(key=lambda x: x["score"], reverse=True)
    
    await redis.set(LEADERBOARD_KEY, json.dumps(leaderboard))
    return leaderboard[:10]

@app.get('/healthz')
async def healthz() -> Response:
    return Response(status_code=200)

@app.get('/ping')
async def ping() -> str:
    return "I'm alive!"

def issue_dummy_orders() -> Order:
    return Order(
        unit=UnitID(
            id=UnitName(name="BZ")
        ),
        target=Position(row="A", column=1),
        method=MovementMethod(method="safe"))
