"""Persistence layer for the Trezo desktop app."""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

from . import config

DEFAULT_PREFERENCES: Dict[str, object] = {
    "theme": "dark",
    "accent": "violet",
    "backgroundStyle": "gradient",
    "bgIntensity": 0.68,
    "cardStyle": "elevated",
    "layoutDensity": "comfortable",
    "fontScale": 1.0,
    "fontFamily": "system",
    "lineHeight": "normal",
    "bodyWeight": "regular",
    "headingFont": "sans",
    "headingStyle": "minimal",
    "headingColor": "auto",
    "textTone": "balanced",
    "privacy": "public",
}

DEFAULT_RUBRICS: List[Dict[str, str]] = [
    {
        "id": "inspiration",
        "title": "Вдохновение",
        "description": "Коллекция идей, мудбордов и подборок оттенков для будущих проектов.",
    },
    {
        "id": "research",
        "title": "Исследования",
        "description": "Аналитика, заметки по интервью и материалы для стратегических решений.",
    },
    {
        "id": "products",
        "title": "Продукты",
        "description": "Карточки функциональности, дорожные карты и MVP-заметки.",
    },
]

DEFAULT_ITEMS: List[Dict[str, str]] = [
    {
        "id": "sketch_01",
        "rubric_id": "inspiration",
        "title": "Световые эскизы",
        "description": "Подборка световых схем и анимаций для раздела настроек.",
    },
    {
        "id": "survey_pack",
        "rubric_id": "research",
        "title": "Интервью UX",
        "description": "Сводка болей пользователей и инсайты по персонализации.",
    },
    {
        "id": "roadmap_q3",
        "rubric_id": "products",
        "title": "Дорожная карта Q3",
        "description": "Фичи для улучшения архива и голосовых подсказок.",
    },
]


@dataclass
class ArchiveItem:
    id: str
    rubric_id: str
    title: str
    description: str


@dataclass
class Rubric:
    id: str
    title: str
    description: str


@dataclass
class DataStore:
    base_dir: Path = field(default_factory=config.resolve_data_dir)
    rubrics_path: Path = field(init=False)
    items_path: Path = field(init=False)
    settings_path: Path = field(init=False)
    rubrics: List[Rubric] = field(default_factory=list)
    items: List[ArchiveItem] = field(default_factory=list)
    preferences: Dict[str, object] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self.rubrics_path = self.base_dir / config.RUBRICS_FILE
        self.items_path = self.base_dir / config.ITEMS_FILE
        self.settings_path = self.base_dir / config.SETTINGS_FILE
        self._load_all()

    # ------------------------------------------------------------------
    # Loading helpers
    def _load_all(self) -> None:
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.preferences = self._load_json(self.settings_path, DEFAULT_PREFERENCES)
        self.rubrics = [Rubric(**row) for row in self._load_json(self.rubrics_path, DEFAULT_RUBRICS)]
        self.items = [ArchiveItem(**row) for row in self._load_json(self.items_path, DEFAULT_ITEMS)]

    def _load_json(self, path: Path, default_value):
        if not path.exists():
            self._write_json(path, default_value)
            return json.loads(json.dumps(default_value))
        try:
            with path.open("r", encoding="utf-8") as fh:
                return json.load(fh)
        except (ValueError, OSError):
            self._write_json(path, default_value)
            return json.loads(json.dumps(default_value))

    def _write_json(self, path: Path, data) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)

    # ------------------------------------------------------------------
    # Preferences
    def update_preference(self, key: str, value) -> None:
        self.preferences[key] = value
        self._write_json(self.settings_path, self.preferences)

    # ------------------------------------------------------------------
    # Archive filtering
    def list_rubrics(self) -> List[Rubric]:
        return self.rubrics

    def list_items(self, rubric_id: Optional[str] = None, query: str = "") -> List[ArchiveItem]:
        normalized_query = query.strip().lower()
        results = [item for item in self.items if not rubric_id or item.rubric_id == rubric_id]
        if normalized_query:
            results = [
                item
                for item in results
                if normalized_query in item.title.lower() or normalized_query in item.description.lower()
            ]
        return results

    def add_item(self, item: ArchiveItem) -> None:
        self.items.append(item)
        payload = [item.__dict__ for item in self.items]
        self._write_json(self.items_path, payload)
