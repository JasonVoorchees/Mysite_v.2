"""Smoke tests for the core views replacing the legacy Java controllers."""
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse


class ArchiveViewTests(TestCase):
    """Ensure the archive dashboard renders successfully."""

    def test_archive_page_renders(self) -> None:
        response = self.client.get(reverse("core:archive"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Ваш архив", status_code=200)


class LandingRedirectTests(TestCase):
    """Verify the landing page redirects authenticated users correctly."""

    def test_landing_redirects_authenticated_user_to_archive(self) -> None:
        user = get_user_model().objects.create_user("auth_user", password="pass1234")
        self.client.force_login(user)

        response = self.client.get(reverse("core:landing"))

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.headers["Location"], reverse("core:archive"))
