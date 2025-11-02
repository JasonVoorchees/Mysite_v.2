"""Replaces the Java web.xml routing with Django URL configuration."""
from django.contrib import admin
from django.urls import include, path

from market import views as market_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(('core.urls', 'core'), namespace='core')),
    path('market/', include('market.urls')),
    path('messages/', market_views.market_messages, name='messages'),
]
