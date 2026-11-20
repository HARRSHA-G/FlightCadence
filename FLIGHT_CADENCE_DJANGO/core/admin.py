from django.contrib import admin

from .models import Aircraft, Airport, CallSign, OnlineFpl, Pilot, UserRecord


@admin.register(UserRecord)
class UserRecordAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "email", "is_active", "is_superuser", "created_at")
    search_fields = ("username", "email")
    ordering = ("id",)


@admin.register(Aircraft)
class AircraftAdmin(admin.ModelAdmin):
    list_display = ("id", "operator", "registration_number", "aircraft_type", "wake_category", "created_at")
    search_fields = ("operator", "registration_number", "aircraft_type")
    ordering = ("id",)
    fields = (
        "operator", "registration_number", "aircraft_type", "wake_category",
        "rcn_equipment_capabilities", "surveillance_equipment_capabilities",
        "pbn", "nav", "gps", "com", "selcal",
    )


@admin.register(Airport)
class AirportAdmin(admin.ModelAdmin):
    list_display = ("id", "fir", "icao_code", "airport_name", "city", "created_at")
    search_fields = ("fir", "icao_code", "airport_name", "city")
    ordering = ("id",)


@admin.register(Pilot)
class PilotAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "license_number", "rank", "created_at")
    search_fields = ("name", "license_number")
    ordering = ("id",)


@admin.register(CallSign)
class CallSignAdmin(admin.ModelAdmin):
    list_display = ("id", "call_sign", "flight_rule", "flight_type", "aircraft_type", "destination")
    search_fields = ("call_sign", "aircraft_type", "destination")
    ordering = ("id",)


@admin.register(OnlineFpl)
class OnlineFplAdmin(admin.ModelAdmin):
    list_display = ("id", "call_sign", "departure_from", "destination_to", "dep_time_utc", "date_of_flight")
    search_fields = ("call_sign", "departure_from", "destination_to")
    ordering = ("id",)
