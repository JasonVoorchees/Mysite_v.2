from __future__ import annotations

from typing import List

from PySide6 import QtCore, QtGui, QtWidgets

from ..data_store import ArchiveItem


class ArchiveView(QtWidgets.QWidget):
    """Simple card-like list of archive items."""

    def __init__(self, parent: QtWidgets.QWidget | None = None) -> None:
        super().__init__(parent)
        self._build_ui()

    def _build_ui(self) -> None:
        layout = QtWidgets.QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)

        self.empty_label = QtWidgets.QLabel("Нет элементов для отображения.")
        self.empty_label.setAlignment(QtCore.Qt.AlignmentFlag.AlignCenter)
        self.empty_label.setVisible(False)
        layout.addWidget(self.empty_label)

        self.list_widget = QtWidgets.QListWidget(objectName="ArchiveList")
        self.list_widget.setWordWrap(True)
        self.list_widget.setSpacing(6)
        self.list_widget.setAlternatingRowColors(False)
        self.list_widget.setSelectionMode(QtWidgets.QAbstractItemView.SelectionMode.NoSelection)
        layout.addWidget(self.list_widget)

    # ------------------------------------------------------------------
    def render_items(self, items: List[ArchiveItem]) -> None:
        self.list_widget.clear()
        if not items:
            self.empty_label.setVisible(True)
            return
        self.empty_label.setVisible(False)
        for item in items:
            list_item = QtWidgets.QListWidgetItem()
            widget = self._build_item_widget(item)
            list_item.setSizeHint(widget.sizeHint())
            self.list_widget.addItem(list_item)
            self.list_widget.setItemWidget(list_item, widget)

    def _build_item_widget(self, item: ArchiveItem) -> QtWidgets.QWidget:
        container = QtWidgets.QFrame()
        container.setObjectName("ArchiveCard")
        container.setFrameShape(QtWidgets.QFrame.Shape.StyledPanel)
        container.setFrameShadow(QtWidgets.QFrame.Shadow.Raised)

        title = QtWidgets.QLabel(item.title)
        title.setWordWrap(True)
        title.setStyleSheet("font-size: 16px; font-weight: 600;")

        description = QtWidgets.QLabel(item.description)
        description.setWordWrap(True)
        description.setStyleSheet("color: rgba(248,250,252,0.8);")

        layout = QtWidgets.QVBoxLayout(container)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(8)
        layout.addWidget(title)
        layout.addWidget(description)
        return container
