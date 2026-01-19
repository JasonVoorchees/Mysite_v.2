"""Template context processors for UI flags."""
from __future__ import annotations

from django.conf import settings
from django.http import HttpRequest


def ui_flags(request: HttpRequest) -> dict[str, bool]:
    """Expose feature toggles to templates."""
    return {
        'show_marketplace_buttons': getattr(settings, 'SHOW_MARKETPLACE_BUTTONS', False),
    }
