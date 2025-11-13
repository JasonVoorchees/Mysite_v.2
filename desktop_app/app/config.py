"""Paths and configuration helpers for the desktop TrezoApp."""
from __future__ import annotations

from pathlib import Path
import os

APP_DIR_NAME = "TrezoApp"
RUBRICS_FILE = "rubrics.json"
ITEMS_FILE = "items.json"
SETTINGS_FILE = "settings.json"


def resolve_data_dir() -> Path:
    """Return (and create) the directory used to persist user data."""
    # Prefer %APPDATA% on Windows; fall back to ~/.local/share on other platforms.
    appdata = os.getenv("APPDATA")
    if appdata:
        base = Path(appdata)
    else:
        base = Path.home() / ".local" / "share"
    target = base / APP_DIR_NAME
    target.mkdir(parents=True, exist_ok=True)
    return target


def data_file_path(name: str) -> Path:
    return resolve_data_dir() / name
