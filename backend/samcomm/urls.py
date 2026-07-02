from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # Main API
    path("api/v1/", include("api.urls")),

    # Enrollment API
    path("api/v1/", include("enrollment.urls")),

    # Numbering API
    path("api/v1/numbering/", include("numbering.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)