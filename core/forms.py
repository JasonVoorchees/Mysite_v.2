"""Replaces the original Java Spring forms with Django form classes."""
from django import forms
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth.models import User

from .models import ArchiveFile, Rubric


class RegistrationForm(UserCreationForm):
    """Handles user registration data formerly processed by Java controllers."""

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('username', 'password1', 'password2', 'email')

    def save(self, commit: bool = True) -> User:
        """Persist the user and copy the email field supplied by the form."""

        user: User = super().save(commit=False)
        email = self.cleaned_data.get('email')
        if email:
            user.email = email
        if commit:
            user.save()
        return user


class LoginForm(AuthenticationForm):
    """Authenticates users similar to the prior Java login form."""


class RubricForm(forms.ModelForm):
    """Collects rubric configuration data for archive categories."""

    class Meta:
        model = Rubric
        fields = ('name', 'slug', 'is_text_mode', 'field_schema')
        widgets = {
            'field_schema': forms.Textarea(attrs={'rows': 3}),
        }


class ArchiveFileForm(forms.ModelForm):
    """Captures archive file metadata mirroring the Java DTO."""

    class Meta:
        model = ArchiveFile
        fields = ('rubric', 'title', 'data')
        widgets = {
            'rubric': forms.HiddenInput(),
            'data': forms.Textarea(attrs={'rows': 3}),
        }
