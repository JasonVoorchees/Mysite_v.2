"""Replaces the Java controller route mappings with Django URL patterns."""
from django.urls import path

from . import views

app_name = 'core'

urlpatterns = [
    path('', views.landing, name='landing'),
    path('index.html', views.landing, name='landing-index'),
    path('archive.html', views.archive, name='archive'),
    path('profile.html', views.profile, name='profile'),
    path('settings.html', views.settings, name='settings'),
    path('news.html', views.news, name='news'),
    path('api/auth/register/', views.register_user, name='register'),
    path('api/auth/login/', views.login_user, name='login'),
    path('api/auth/logout/', views.logout_user, name='logout'),
    path('api/archive/rubrics/', views.create_rubric, name='create-rubric'),
    path('api/archive/files/', views.create_archive_file, name='create-file'),
]
