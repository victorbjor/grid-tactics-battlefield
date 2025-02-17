import os
import json
from typing import List

import instructor
from openai import AsyncOpenAI

from custom_types import EnemyInfo, FriendInfo, GameStateMessage, Order, Orders, UnitType


MODEL_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
VISION_MODEL = "gemini-1.5-flash"
DECISION_MODEL = "gemini-1.5-flash"


API_KEY = os.getenv("GEMINI_API_KEY")

if API_KEY is None:
    raise ValueError("GEMINI_API_KEY environment variable is not set.")

base_client = AsyncOpenAI(
    base_url= MODEL_URL,
    api_key=API_KEY
)

client = instructor.from_openai(
    base_client,
    mode=instructor.Mode.JSON, 
)

def cartesian_to_algebraic(x, y) -> str:
    """
    Convert Cartesian coordinates (x, y) to chess algebraic notation.
    
    Parameters:
        x (int): The column number, where 0 corresponds to 'A', 1 to 'B', and so on.
        y (int): The row number, where 0 corresponds to rank '1', 1 to '2', and so on.
    
    Returns:
        str: The algebraic notation as a string, e.g., 'a1', 'c7'.
    """
    
    file = chr(x + ord('A'))  # Convert x to a letter (a-h)
    rank = str(y + 1)         # Convert y to a rank (1-8)
    return file + rank

def get_terrain_in_tile(x, y) -> str:
    return [
      ['base', 'ground', 'ground', 'ground', 'forest', 'forest', 'forest', 'ground', 'ground', 'water', 'water', 'ground'],
      ['ground', 'ground', 'hill', 'ground', 'forest', 'forest', 'forest', 'ground', 'ground', 'water', 'water', 'water'],
      ['ground', 'water', 'water', 'ground', 'ground', 'forest', 'ground', 'ground', 'ground', 'ground', 'water', 'water'],
      ['ground', 'water', 'water', 'water', 'ground', 'ground', 'ground', 'hill', 'ground', 'ground', 'ground', 'ground'],
      ['ground', 'ground', 'water', 'water', 'ground', 'ground', 'ground', 'ground', 'forest', 'forest', 'forest', 'ground'],
      ['ground', 'ground', 'ground', 'ground', 'hill', 'ground', 'ground', 'ground', 'forest', 'forest', 'forest', 'ground'],
      ['ground', 'forest', 'forest', 'ground', 'ground', 'ground', 'water', 'water', 'ground', 'ground', 'ground', 'ground'],
      ['ground', 'forest', 'forest', 'forest', 'ground', 'ground', 'water', 'water', 'water', 'ground', 'hill', 'ground'],
      ['ground', 'ground', 'forest', 'forest', 'ground', 'ground', 'ground', 'water', 'ground', 'ground', 'ground', 'ground'],
      ['ground', 'ground', 'ground', 'ground', 'water', 'water', 'ground', 'ground', 'ground', 'forest', 'forest', 'ground'],
      ['ground', 'hill', 'ground', 'ground', 'water', 'water', 'water', 'ground', 'ground', 'forest', 'forest', 'forest'],
      ['ground', 'ground', 'ground', 'ground', 'ground', 'water', 'ground', 'ground', 'ground', 'ground', 'forest', 'ground'],
    ][y][x]

def format_models_json(models):
    return json.dumps([model.dict() for model in models], indent=4)


def extract_unit_info(models: List[UnitType]):
    friend_names = []
    friends = []
    enemies = []
    for model in models:
        if model.type == 'friendly':
            friend_names.append(model.name)
            friends.append(
                FriendInfo(
                    name=model.name,
                    target_tile=cartesian_to_algebraic(model.target.x, model.target.y),
                    current_tile=cartesian_to_algebraic(model.location.x, model.location.y),
                    current_terrain= get_terrain_in_tile(model.location.x, model.location.y),
                    target_terrain=get_terrain_in_tile(model.target.x, model.target.y),
                    health=model.health,
                    movement_style='Safe' if model.moveSafely else 'Fast'
                )
            )
        else:
            enemies.append(
                EnemyInfo(
                    current_tile=cartesian_to_algebraic(model.location.x, model.location.y),
                    current_terrain=get_terrain_in_tile(model.location.x, model.location.y),
                    health=model.health,
                )
            )
    return friend_names, friends, enemies


def describe_game_state(game_state: GameStateMessage, command: List[str]) -> str:
    """
    Generate a description of the game state for the decision layer.
    """
    friend_names, friends, enemies = extract_unit_info(game_state.units)

    return (
        f"Your base is under attack! This is the order history from your commander, fulfilling these orders is crucial. The orders are in chronological order, so the most recent order is listed last. \n "
        + '/n'.join(command) + "\n\n"
        f"There are {len(game_state.messages)} new reports from the battlefield:\n\n"
        + "\n\n".join(game_state.messages) +"\n\n\n"
        f"You have {len(friends)} units at your command."
        f"Their names are: {', '.join(friend_names)}. "
        f"Here's their current status:\n"
        + format_models_json(friends)
        + "\n\nEnemies spotted on the battlefield:\n"
        + format_models_json(enemies)
    )

system_message= """
You are playing a game called Grid Tactics. The object of the game is to protect your base (located at position A1) from enemy attacks. You have a team of units that you can move around the grid to defend your base.
Enemies will spawn in the far end of the grid (position L12), however, friendly units must avoid that specific tile as they will die if an enemy spawns on top of them.
Each tile of the grid has a specific terrain type, which can affect the movement and combat abilities of your units. Hills, forest, and the base tiles provide good cover. Units engaged in fighting on those tiles will only take a tenth of the damage they would on open ground. However, movement in those tiles is random and there is a 50% risk that the unit will not move when located in such a tile.
Water is impassable and cannot be traversed at all. Neither can two units occupy the same tile. Rember that you can only choose columns A through L and rows 1 through 12.
Each unit has a certain amount of health and ammo. If a unit runs out of either, it will be unable to fight or move. 
You can issue commands to your units to move them around the grid and engage in combat with enemy units.
When issued a command, a unit will run a path finding algorithm that either favors safe or fast terrain tiles, it will then move to the new tile and request new orders.
Fighting is engaged as soon as two units are in neighboring tiles. 
You may issue one command each to your units.

Here follows the terrain layout.
              COL A\tCOL B\tCOL C\tCOL D\tCOL E\tCOL F\tCOL G\tCOL H\tCOL I\tCOL J\tCOL K\tCOL L
      ROW 1:  base\tground\tground\tground\tforest\tforest\tforest\tground\tground\twater\twater\tground
      ROW 2:  ground\tground\thill\tground\tforest\tforest\tforest\tground\tground\twater\twater\twater
      ROW 3:  ground\twater\twater\tground\tground\tforest\tground\tground\tground\tground\twater\twater
      ROW 4:  ground\twater\twater\twater\tground\tground\tground\thill\tground\tground\tground\tground
      ROW 5:  ground\tground\twater\twater\tground\tground\tground\tground\tforest\tforest\tforest\tground
      ROW 6:  ground\tground\tground\tground\thill\tground\tground\tground\tforest\tforest\tforest\tground
      Row 7:  ground\tforest\tforest\tground\tground\tground\twater\twater\tground\tground\tground\tground
      Row 8:  ground\tforest\tforest\tforest\tground\tground\twater\twater\twater\tground\thill\tground
      Row 9:  ground\tground\tforest\tforest\tground\tground\tground\twater\tground\tground\tground\tground
      Row 10: ground\tground\tground\tground\twater\twater\tground\tground\tground\tforest\tforest\tground
      Row 11: ground\thill\tground\tground\twater\twater\twater\tground\tground\tforest\tforest\tforest
      Row 12: ground\tground\tground\tground\tground\twater\tground\tground\tground\tground\tforest\tground
"""


async def call_order_layer(game_state: GameStateMessage, command: List[str]) -> Order | None:
    try:
        print(describe_game_state(game_state, command))
        return await client.chat.completions.create(
            model=DECISION_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_message,
                },
                {
                    "role": "user",
                    "content": describe_game_state(game_state, command) ,
                }
            ],
            response_model=Orders,
        ) # type: ignore
    except Exception as e:
        print(f"Error calling decision layer: {e}")
        return None


# async def main():
#     order = await call_order_layer(user_message, 'Hold the hills at all cost!')
#     if order is not None:
#         print(order)

# if __name__ == "__main__":
#     asyncio.run(main())


