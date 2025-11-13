from __future__ import annotations

from functools import partial

from PySide6 import QtCore, QtGui, QtWidgets

from ..data_store import DataStore
from .archive_view import ArchiveView
from .settings_view import SettingsView


class MainWindow(QtWidgets.QMainWindow):
    def __init__(self, store: DataStore) -> None:
        super().__init__()
        self.store = store
        self.setWindowTitle("Trezo Desktop")
        self.resize(1280, 800)
        self.current_rubric_id: str | None = None
        self._build_ui()
        self._apply_preferences()
        self._load_initial_state()

    # ------------------------------------------------------------------
    def _build_ui(self) -> None:
        central = QtWidgets.QWidget()
        root_layout = QtWidgets.QHBoxLayout(central)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.setSpacing(0)

        self.sidebar = self._build_sidebar()
        root_layout.addWidget(self.sidebar)

        self.stack = QtWidgets.QStackedWidget()
        self.archive_view = ArchiveView()
        self.settings_view = SettingsView(self.store.preferences)
        self.settings_view.preferenceChanged.connect(self._on_preference_change)
        self.stack.addWidget(self.archive_view)
        self.stack.addWidget(self.settings_view)

        root_layout.addWidget(self.stack, 1)
        self.setCentralWidget(central)

    def _build_sidebar(self) -> QtWidgets.QFrame:
        frame = QtWidgets.QFrame(objectName="Sidebar")
        frame.setFixedWidth(320)
        layout = QtWidgets.QVBoxLayout(frame)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)

        title = QtWidgets.QLabel("Архив")
        title.setObjectName("SidebarTitle")
        title.setStyleSheet("font-size: 20px; font-weight: 700;")
        layout.addWidget(title)

        search_container = QtWidgets.QHBoxLayout()
        self.search_input = QtWidgets.QLineEdit()
        self.search_input.setPlaceholderText("Поиск по архиву…")
        self.search_button = QtWidgets.QPushButton("Поиск", objectName="SearchButton")
        self.search_button.clicked.connect(self._apply_search)
        search_container.addWidget(self.search_input, 1)
        search_container.addWidget(self.search_button)
        layout.addLayout(search_container)

        layout.addWidget(self._build_rubric_list())

        self.settings_button = QtWidgets.QPushButton("Настройки", objectName="SettingsButton")
        self.settings_button.clicked.connect(partial(self._open_page, "settings"))
        layout.addWidget(self.settings_button)
        layout.addStretch(1)
        return frame

    def _build_rubric_list(self) -> QtWidgets.QListWidget:
        self.rubric_list = QtWidgets.QListWidget(objectName="RubricList")
        self.rubric_list.setSelectionMode(QtWidgets.QAbstractItemView.SelectionMode.SingleSelection)
        self.rubric_list.itemSelectionChanged.connect(self._on_rubric_changed)
        for rubric in self.store.list_rubrics():
            item = QtWidgets.QListWidgetItem(rubric.title)
            item.setData(QtCore.Qt.ItemDataRole.UserRole, rubric.id)
            item.setToolTip(rubric.description)
            self.rubric_list.addItem(item)
        return self.rubric_list

    # ------------------------------------------------------------------
    def _load_initial_state(self) -> None:
        if self.rubric_list.count() > 0:
            self.rubric_list.setCurrentRow(0)
        self._open_page("archive")

    def _apply_search(self) -> None:
        query = self.search_input.text()
        self._refresh_archive(query=query)

    def _on_rubric_changed(self) -> None:
        selected = self.rubric_list.currentItem()
        self.current_rubric_id = selected.data(QtCore.Qt.ItemDataRole.UserRole) if selected else None
        self._refresh_archive()

    def _refresh_archive(self, query: str | None = None) -> None:
        if self.stack.currentWidget() is not self.archive_view:
            self._open_page("archive")
        rubric_id = self.current_rubric_id
        items = self.store.list_items(rubric_id=rubric_id, query=query or self.search_input.text())
        self.archive_view.render_items(items)

    def _open_page(self, target: str) -> None:
        if target == "settings":
            self.stack.setCurrentWidget(self.settings_view)
        else:
            self.stack.setCurrentWidget(self.archive_view)

    # ------------------------------------------------------------------
    def _on_preference_change(self, key: str, value) -> None:
        self.store.update_preference(key, value)
        self._apply_preferences()

    def _apply_preferences(self) -> None:
        prefs = self.store.preferences
        accent = {
            "blue": "#3b82f6",
            "violet": "#7c3aed",
            "emerald": "#10b981",
            "amber": "#f59e0b",
            "rose": "#f43f5e",
            "sky": "#38bdf8",
            "mint": "#2dd4bf",
            "copper": "#f97316",
        }.get(prefs.get("accent"), "#7c3aed")

        palette = self.palette()
        palette.setColor(QtGui.QPalette.ColorRole.Window, QtGui.QColor("#0f172a"))
        palette.setColor(QtGui.QPalette.ColorRole.WindowText, QtGui.QColor("#f8fafc"))
        palette.setColor(QtGui.QPalette.ColorRole.Button, QtGui.QColor(accent))
        self.setPalette(palette)

        intensity = float(prefs.get("bgIntensity", 0.68))
        opacity = max(0.2, min(0.95, intensity))
        sidebar_color = QtGui.QColor(15, 23, 42)
        sidebar_color.setAlphaF(opacity)
        self.sidebar.setStyleSheet(f"background-color: rgba(15,23,42,{opacity});")

        font_scale = float(prefs.get("fontScale", 1.0))
        base_font = self.font()
        base_font.setPointSizeF(12 * font_scale)
        self.setFont(base_font)

        family_map = {
            "system": base_font.defaultFamily(),
            "arial": "Arial",
            "montserrat": "Montserrat",
            "roboto": "Roboto",
            "playfair": "Playfair Display",
            "lato": "Lato",
            "kudry": "Kudry",
        }
        if prefs.get("fontFamily") in family_map:
            base_font.setFamily(family_map[prefs["fontFamily"]])
            self.setFont(base_font)

    # ------------------------------------------------------------------
    def load_stylesheet(self, path: str) -> None:
        try:
            with open(path, "r", encoding="utf-8") as fh:
                self.setStyleSheet(fh.read())
        except OSError:
            pass
