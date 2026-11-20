"""Core URL configuration for FLIGHT CADENCE.

Page routes (public + app + auth) and JSON API routes mirroring the legacy
FastAPI backend. All CSRF-exempt API endpoints accept application/json.
"""
from django.urls import path
from django.views.decorators.csrf import csrf_exempt

from . import views, api_views, pdf_views

# ---------------------------------------------------------------------------
# Page routes
# ---------------------------------------------------------------------------
urlpatterns = [

    # Public (BEFORE login)
    path("", views.landing, name="landing"),
    path("trip-support", views.trip_support, name="trip_support"),
    path("airports", views.airports_public, name="airports_public"),
    path("about", views.about, name="about"),
    path("pricing", views.pricing, name="pricing"),
    path("contact", views.contact, name="contact"),

    # Auth
    path("login", views.login_view, name="login"),
    path("register", views.register_view, name="register"),
    path("forgot-password", views.forgot_password, name="forgot_password"),
    path("logout", views.logout_view, name="logout"),

    # App (AFTER login)
    path("dashboard", views.dashboard, name="dashboard"),
    path("profile", views.profile, name="profile"),
    path("aircraft-management", views.aircraft_management, name="aircraft_management"),
    path("airport-management", views.airport_management, name="airport_management"),
    path("pilot-management", views.pilot_management, name="pilot_management"),
    path("online-fpl", views.online_fpl, name="online_fpl"),
    path("call-signs", views.call_signs, name="call_signs"),
    path("notams", views.notams, name="notams"),
    path("weather", views.weather, name="weather"),
    path("nav-log", views.nav_log, name="nav_log"),
    path("pdf-edit", views.pdf_edit, name="pdf_edit"),
    path("pdf-merge", views.pdf_merge, name="pdf_merge"),
    path("scrape-form", views.scrape_form, name="scrape_form"),
    path("route-plan", views.route_plan, name="route_plan"),

    # Admin
    path("users", views.users_management, name="users_management"),
    path("users-management", views.users_management),
    path("settings", views.system_settings, name="system_settings"),

    # -----------------------------------------------------------------------
    # JSON API routes (mirror legacy FastAPI: /api/...)
    # -----------------------------------------------------------------------
    path("api/login", csrf_exempt(api_views.api_login), name="api_login"),
    path("api/logout", csrf_exempt(api_views.api_logout), name="api_logout"),

    # Call Signs (camelCase payload)
    path("api/call-signs", csrf_exempt(api_views.call_signs_list_create),
         name="api_call_signs_list_create"),
    path("api/call-signs/<int:pk>", csrf_exempt(api_views.call_signs_detail),
         name="api_call_signs_detail"),

    # Online FPLs (camelCase payload; no DELETE)
    path("api/online-fpls", csrf_exempt(api_views.online_fpls_list_create),
         name="api_online_fpls_list_create"),
    path("api/online-fpls/<int:pk>", csrf_exempt(api_views.online_fpls_detail),
         name="api_online_fpls_detail"),

    # Aircrafts (snake_case payload)
    path("api/aircrafts", csrf_exempt(api_views.aircrafts_list_create),
         name="api_aircrafts_list_create"),
    path("api/aircrafts/<int:pk>", csrf_exempt(api_views.aircrafts_detail),
         name="api_aircrafts_detail"),

    # Airports (snake_case payload)
    path("api/airports", csrf_exempt(api_views.airports_list_create),
         name="api_airports_list_create"),
    path("api/airports/<int:pk>", csrf_exempt(api_views.airports_detail),
         name="api_airports_detail"),

    # Pilots (snake_case payload)
    path("api/pilots", csrf_exempt(api_views.pilots_list_create),
         name="api_pilots_list_create"),
    path("api/pilots/<int:pk>", csrf_exempt(api_views.pilots_detail),
         name="api_pilots_detail"),

    # Misc API
    path("api/pdf-to-word", csrf_exempt(pdf_views.pdf_to_word),
         name="api_pdf_to_word"),
    path("flights", api_views.flights, name="api_flights"),

]
