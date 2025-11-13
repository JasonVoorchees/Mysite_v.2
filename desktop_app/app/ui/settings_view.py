from __future__ import annotations

from typing import Dict, List, Tuple

from PySide6 import QtCore, QtWidgets


PreferenceOption = Tuple[str, str]


class SettingsView(QtWidgets.QScrollArea):
    preferenceChanged = QtCore.Signal(str, object)

    def __init__(self, preferences: Dict[str, object], parent: QtWidgets.QWidget | None = None) -> None:
        super().__init__(parent)
        self.setWidgetResizable(True)
        self.preferences = preferences
        self._build_ui()

    def _build_ui(self) -> None:
        container = QtWidgets.QWidget()
        self.setWidget(container)
        layout = QtWidgets.QVBoxLayout(container)
        layout.setContentsMargins(32, 32, 32, 32)
        layout.setSpacing(24)

        layout.addWidget(self._theme_section())
        layout.addWidget(self._typography_section())
        layout.addWidget(self._privacy_section())
        layout.addStretch(1)

    # ------------------------------------------------------------------
    def _theme_section(self) -> QtWidgets.QGroupBox:
        box = QtWidgets.QGroupBox("Оформление")
        box_layout = QtWidgets.QVBoxLayout(box)
        box_layout.setSpacing(18)

        box_layout.addLayout(self._build_radio_row(
            "Тема оформления",
            "theme",
            [
                ("dark", "Тёмная"),
                ("light", "Светлая"),
                ("contrast", "Контрастная"),
                ("retro", "Ретро"),
                ("sepia", "Сепия"),
                ("midnight", "Полночь"),
                ("aurora", "Сияние"),
                ("pastel", "Пастель"),
            ],
        ))

        box_layout.addLayout(self._build_radio_row(
            "Акцентный цвет",
            "accent",
            [
                ("blue", "Синий"),
                ("violet", "Фиолетовый"),
                ("emerald", "Морской"),
                ("amber", "Янтарный"),
                ("rose", "Розовый"),
                ("sky", "Небесный"),
                ("mint", "Мятный"),
                ("copper", "Медный"),
            ],
        ))

        box_layout.addLayout(self._build_radio_row(
            "Фон страниц",
            "backgroundStyle",
            [
                ("gradient", "Градиент"),
                ("mesh", "Сеточный свет"),
                ("soft", "Мягкий туман"),
            ],
        ))

        # background intensity slider
        range_layout = QtWidgets.QVBoxLayout()
        label = QtWidgets.QLabel("Интенсивность фона")
        slider = QtWidgets.QSlider(QtCore.Qt.Orientation.Horizontal)
        slider.setRange(0, 100)
        slider.setValue(int(float(self.preferences.get("bgIntensity", 0.68)) * 100))
        hint = QtWidgets.QLabel(self._format_bg_hint(slider.value()))
        slider.valueChanged.connect(lambda value: self._on_bg_intensity_change(value, hint))
        range_layout.addWidget(label)
        range_layout.addWidget(slider)
        range_layout.addWidget(hint)
        box_layout.addLayout(range_layout)

        box_layout.addLayout(self._build_radio_row(
            "Внешний вид карточек",
            "cardStyle",
            [
                ("elevated", "Объёмные"),
                ("flat", "Плоские"),
                ("outline", "С контуром"),
            ],
        ))

        return box

    def _format_bg_hint(self, slider_value: int) -> str:
        return f"{slider_value}%"

    def _on_bg_intensity_change(self, value: int, hint_label: QtWidgets.QLabel) -> None:
        hint_label.setText(self._format_bg_hint(value))
        self.preferenceChanged.emit("bgIntensity", value / 100)

    # ------------------------------------------------------------------
    def _privacy_section(self) -> QtWidgets.QGroupBox:
        box = QtWidgets.QGroupBox("Конфиденциальность профиля")
        layout = QtWidgets.QVBoxLayout(box)
        layout.addLayout(self._build_radio_row(
            "Статус профиля",
            "privacy",
            [
                ("public", "Публичный"),
                ("friends", "Только друзьям"),
                ("private", "Закрытый"),
            ],
        ))
        return box

    # ------------------------------------------------------------------
    def _typography_section(self) -> QtWidgets.QGroupBox:
        box = QtWidgets.QGroupBox("Типографика")
        layout = QtWidgets.QVBoxLayout(box)
        layout.setSpacing(18)

        font_scale = QtWidgets.QSlider(QtCore.Qt.Orientation.Horizontal)
        font_scale.setRange(85, 160)
        font_scale.setValue(int(float(self.preferences.get("fontScale", 1.0)) * 100))
        font_hint = QtWidgets.QLabel(f"{font_scale.value()}%")
        font_scale.valueChanged.connect(lambda value: self._on_font_scale_change(value, font_hint))

        layout.addWidget(QtWidgets.QLabel("Размер шрифта"))
        layout.addWidget(font_scale)
        layout.addWidget(font_hint)

        layout.addLayout(self._build_radio_row(
            "Шрифт интерфейса",
            "fontFamily",
            [
                ("system", "Системный"),
                ("arial", "Arial"),
                ("montserrat", "Montserrat"),
                ("roboto", "Roboto"),
                ("playfair", "Playfair Display"),
                ("lato", "Lato"),
                ("kudry", "Kudry"),
            ],
        ))

        layout.addLayout(self._build_radio_row(
            "Межстрочный интервал",
            "lineHeight",
            [
                ("normal", "Стандарт"),
                ("relaxed", "Свободный"),
                ("compact", "Компактный"),
            ],
        ))

        layout.addLayout(self._build_radio_row(
            "Насыщенность текста",
            "bodyWeight",
            [
                ("regular", "Обычная"),
                ("medium", "Усиленная"),
                ("strong", "Жирная"),
            ],
        ))

        layout.addLayout(self._build_radio_row(
            "Семейство заголовков",
            "headingFont",
            [
                ("sans", "Современные"),
                ("serif", "Классические"),
                ("display", "Акцентные"),
            ],
        ))

        layout.addLayout(self._build_radio_row(
            "Стиль заголовков",
            "headingStyle",
            [
                ("minimal", "Нейтральные"),
                ("soft", "С акцентом"),
                ("caps", "Капс"),
            ],
        ))

        layout.addLayout(self._build_radio_row(
            "Цвет заголовков",
            "headingColor",
            [
                ("auto", "Авто"),
                ("accent", "Акцент"),
                ("muted", "Мягкий"),
            ],
        ))

        layout.addLayout(self._build_radio_row(
            "Тональность текста",
            "textTone",
            [
                ("balanced", "Сбалансированная"),
                ("soft", "Мягкая"),
                ("bold", "Насыщенная"),
            ],
        ))

        return box

    def _on_font_scale_change(self, value: int, hint: QtWidgets.QLabel) -> None:
        hint.setText(f"{value}%")
        self.preferenceChanged.emit("fontScale", value / 100)

    # ------------------------------------------------------------------
    def _build_radio_row(self, title: str, pref_key: str, options: List[PreferenceOption]) -> QtWidgets.QVBoxLayout:
        wrapper = QtWidgets.QVBoxLayout()
        wrapper.setSpacing(6)
        wrapper.addWidget(QtWidgets.QLabel(title))
        row = QtWidgets.QHBoxLayout()
        row.setSpacing(8)
        group = QtWidgets.QButtonGroup(self)
        for value, label in options:
            button = QtWidgets.QRadioButton(label)
            button.setChecked(self.preferences.get(pref_key) == value)
            group.addButton(button)
            button.toggled.connect(lambda checked, key=pref_key, opt=value: self._on_radio_toggle(key, opt, checked))
            row.addWidget(button)
        row.addStretch(1)
        wrapper.addLayout(row)
        return wrapper

    def _on_radio_toggle(self, key: str, value: str, checked: bool) -> None:
        if checked:
            self.preferenceChanged.emit(key, value)
