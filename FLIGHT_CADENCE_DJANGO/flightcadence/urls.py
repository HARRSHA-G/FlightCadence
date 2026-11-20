from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "FLIGHT CADENCE Admin Panel"
admin.site.site_title = "FLIGHT CADENCE Admin"
admin.site.index_title = "FLIGHT CADENCE Database Admin"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("core.urls")),
]
