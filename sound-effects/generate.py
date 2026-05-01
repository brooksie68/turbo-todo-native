"""
TurboTodo Sound Effects Generator — ElevenLabs API
Usage: python generate.py
Outputs MP3s to sound-effects/new/
API key in .env (gitignored): ELEVENLABS_API_KEY=...
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from elevenlabs import ElevenLabs

load_dotenv()
client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

OUTPUT_DIR = Path(__file__).parent / "new"
OUTPUT_DIR.mkdir(exist_ok=True)

# --- Prompts ---
# Best task-complete prompt so far (v4, now v1 in new/):
# "two distinct soft tones in sequence, short pause between them, second tone slightly higher,
#  gentle and round, like a soft boop then a bup, pleasant UI sound"
# Settings: prompt_influence=0.8, duration_seconds=0.9

def generate(name: str, prompt: str, influence: float = 0.8, duration: float = 0.9):
    print(f"Generating {name}...")
    result = client.text_to_sound_effects.convert(
        text=prompt,
        prompt_influence=influence,
        duration_seconds=duration,
    )
    path = OUTPUT_DIR / f"{name}.mp3"
    with open(path, "wb") as f:
        for chunk in result:
            f.write(chunk)
    print(f"  → {path}")

# --- Generate ---

BASE_PROMPT = (
    "two distinct soft tones in sequence, short pause between them, "
    "second tone slightly higher, gentle and round, like a soft boop then a bup, "
    "pleasant UI sound"
)

VARIATIONS = [
    # name, prompt, influence, duration
    ("task-complete-7",  BASE_PROMPT + ", slightly faster tempo",                              0.8, 0.8),
    ("task-complete-8",  BASE_PROMPT + ", faster tempo, slightly higher pitched",              0.8, 0.8),
    ("task-complete-9",  BASE_PROMPT + ", brisk and snappy, higher register",                  0.85, 0.75),
    ("task-complete-10", BASE_PROMPT + ", quick and light, higher frequency tones",            0.85, 0.75),
    ("task-complete-11", BASE_PROMPT + ", punchy and quick, tones in a higher register",       0.9, 0.7),
]

for name, prompt, influence, duration in VARIATIONS:
    generate(name, prompt, influence, duration)

print("Done.")
