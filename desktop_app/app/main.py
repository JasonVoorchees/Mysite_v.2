from __future__ import annotations

import sys
from pathlib import Path

from PySide6 import QtWidgets

from .data_store import DataStore
from .ui.main_window import MainWindow


def run() -> int:
    app = QtWidgets.QApplication(sys.argv)
    store = DataStore()
    window = MainWindow(store)
    qss_path = Path(__file__).resolve().parent.parent / "resources" / "styles.qss"
    window.load_stylesheet(str(qss_path))
    window.show()
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(run())
