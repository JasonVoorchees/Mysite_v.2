"""Replaces the Java Spring MVC controllers with Django view functions."""
from __future__ import annotations

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_POST

from .forms import ArchiveFileForm, LoginForm, RegistrationForm, RubricForm
from .models import Profile


def landing(request: HttpRequest) -> HttpResponse:
    """Render the landing page."""
    if request.user.is_authenticated:
        return redirect('core:archive')
    return render(request, 'index.html')


def archive(request: HttpRequest) -> HttpResponse:
    """Render the archive dashboard."""
    return render(request, 'archive.html')


def profile(request: HttpRequest) -> HttpResponse:
    """Render the profile page."""
    return render(request, 'profile.html')


def settings(request: HttpRequest) -> HttpResponse:
    """Render the settings page."""
    return render(request, 'settings.html')


def news(request: HttpRequest) -> HttpResponse:
    """Render the news/instructions page."""
    template = 'news.html'
    return render(request, template)


@require_POST
def register_user(request: HttpRequest) -> JsonResponse:
    """Handle AJAX registration requests similar to the former Java endpoint."""
    form = RegistrationForm(request.POST)
    if form.is_valid():
        user = form.save()
        authenticated = authenticate(
            request,
            username=user.get_username(),
            password=form.cleaned_data.get('password1'),
        )
        if authenticated is None:
            return JsonResponse(
                {'success': False, 'errors': {'__all__': ['Не удалось создать сессию пользователя.']}},
                status=500,
            )
        Profile.objects.get_or_create(user=authenticated)
        login(request, authenticated)
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'errors': form.errors}, status=400)


@require_POST
def login_user(request: HttpRequest) -> JsonResponse:
    """Handle AJAX login requests formerly processed by Java controllers."""
    form = LoginForm(request, data=request.POST)
    if form.is_valid():
        login(request, form.get_user())
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'errors': form.errors}, status=400)


@require_POST
def logout_user(request: HttpRequest) -> JsonResponse:
    """Terminate the current session, matching the previous Java logout route."""
    logout(request)
    return JsonResponse({'success': True})


@login_required
@require_POST
def create_rubric(request: HttpRequest) -> JsonResponse:
    """Create a rubric entry using the Django ORM in place of Java services."""
    form = RubricForm(request.POST)
    if form.is_valid():
        rubric = form.save(commit=False)
        profile, _ = Profile.objects.get_or_create(user=request.user)
        rubric.profile = profile
        rubric.save()
        return JsonResponse({'success': True, 'rubric_id': rubric.pk})
    return JsonResponse({'success': False, 'errors': form.errors}, status=400)


@login_required
@require_POST
def create_archive_file(request: HttpRequest) -> JsonResponse:
    """Persist an archive file entry, mirroring the Java backend."""
    form = ArchiveFileForm(request.POST)
    if form.is_valid():
        archive_file = form.save(commit=False)
        if archive_file.rubric.profile.user != request.user:
            return JsonResponse({'success': False, 'errors': {'rubric': ['Недостаточно прав для добавления файла.']}}, status=403)
        archive_file.save()
        return JsonResponse({'success': True, 'file_id': archive_file.pk})
    return JsonResponse({'success': False, 'errors': form.errors}, status=400)
