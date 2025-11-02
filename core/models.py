"""Replaces the original Java entity classes with Django ORM models."""
from django.conf import settings
from django.db import models


class Profile(models.Model):
    """Stores user profile metadata formerly held in a Java Profile entity."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    display_name = models.CharField(max_length=150, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    avatar_meta = models.JSONField(default=dict, blank=True)
    privacy_level = models.CharField(max_length=50, default='public')

    def __str__(self) -> str:  # pragma: no cover
        return self.display_name or self.user.get_username()


class Rubric(models.Model):
    """Represents archive categories, replacing the Java Rubric entity."""

    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='rubrics')
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    is_text_mode = models.BooleanField(default=False)
    field_schema = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('profile', 'slug')
        ordering = ['created_at']

    def __str__(self) -> str:  # pragma: no cover
        return self.name


class ArchiveFile(models.Model):
    """Stores archive items, replacing the Java ArchiveFile entity."""

    rubric = models.ForeignKey(Rubric, on_delete=models.CASCADE, related_name='files')
    title = models.CharField(max_length=255)
    data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:  # pragma: no cover
        return self.title


class ArchiveFileImage(models.Model):
    """Stores multiple images for an archive file, replacing the Java ArchiveFileImage entity."""

    archive_file = models.ForeignKey(ArchiveFile, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='archive/')
    display_order = models.PositiveIntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.archive_file}: {self.display_order}"
