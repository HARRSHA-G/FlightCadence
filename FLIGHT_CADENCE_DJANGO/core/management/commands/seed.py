"""Seed the FLIGHT CADENCE database from _seed/seed.json.

Usage:
    python manage.py seed          # load seed data (skips existing rows)
    python manage.py seed --clear  # truncate tables before loading
"""
import json
import os
from datetime import datetime

from django.core.management.base import BaseCommand
from django.db import connection

from core.models import CallSign, OnlineFpl, UserRecord, Aircraft, Airport, Pilot

SEED_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "_seed", "seed.json")


def _parse_dt(value):
    """Parse legacy created_at 'YYYY-MM-DD HH:MM:SS' into aware datetime."""
    if not value:
        return None
    try:
        return datetime.strptime(str(value).strip(), "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None


def _to_bool(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip() in ("1", "true", "yes", "on")


class Command(BaseCommand):
    help = "Seed the database from _seed/seed.json"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing rows in the 6 tables before seeding.",
        )

    def handle(self, *args, **options):
        if not os.path.exists(SEED_PATH):
            self.stderr.write(self.style.ERROR(f"Seed file not found: {SEED_PATH}"))
            return

        with open(SEED_PATH, "r", encoding="utf-8") as f:
            seed = json.load(f)

        if options["clear"]:
            with connection.cursor() as cursor:
                # SQLite: disable FK checks temporarily for clean truncation.
                cursor.execute("PRAGMA foreign_keys = OFF")
                for table in ["users", "call_signs", "online_fpls", "aircrafts", "airports", "pilots"]:
                    cursor.execute(f'DELETE FROM "{table}"')
                cursor.execute("PRAGMA foreign_keys = ON")
            self.stdout.write(self.style.WARNING("Cleared all tables."))

        counts = {}

        # users
        users = seed.get("users", [])
        for u in users:
            UserRecord.objects.get_or_create(
                username=u.get("username"),
                defaults={
                    "email": u.get("email", ""),
                    "hashed_password": u.get("hashed_password", ""),
                    "is_active": _to_bool(u.get("is_active", True)),
                    "is_superuser": _to_bool(u.get("is_superuser", False)),
                },
            )
        counts["users"] = UserRecord.objects.count()

        # call_signs
        for cs in seed.get("call_signs", []):
            CallSign.objects.get_or_create(
                id=cs.get("id"),
                defaults={
                    "call_sign": cs.get("call_sign", ""),
                    "flight_rule": cs.get("flight_rule", ""),
                    "flight_type": cs.get("flight_type", ""),
                    "aircraft_type": cs.get("aircraft_type", ""),
                    "weight_category": cs.get("weight_category", ""),
                    "equipments": cs.get("equipments", ""),
                    "departure": cs.get("departure", ""),
                    "dep_time": cs.get("dep_time", ""),
                    "date_of_flight": cs.get("date_of_flight", ""),
                    "speed": cs.get("speed", ""),
                    "level": cs.get("level", ""),
                    "route": cs.get("route", ""),
                    "destination": cs.get("destination", ""),
                    "total_flying_time": cs.get("total_flying_time", ""),
                    "alternate_1": cs.get("alternate_1") or None,
                    "alternate_2": cs.get("alternate_2") or None,
                    "dep_station": cs.get("dep_station", ""),
                    "dep_lat_long": cs.get("dep_lat_long", ""),
                    "dest_station": cs.get("dest_station", ""),
                    "dest_lat_long": cs.get("dest_lat_long", ""),
                    "alternate_station": cs.get("alternate_station") or None,
                    "pilot_in_command": cs.get("pilot_in_command", ""),
                    "mobile_no": cs.get("mobile_no", ""),
                    "co_pilot": cs.get("co_pilot") or None,
                    "cabin_crew": cs.get("cabin_crew") or None,
                    "endurance": cs.get("endurance") or "",
                    "performance": cs.get("performance") or "",
                    "registration": cs.get("registration") or None,
                    "operator": cs.get("operator") or None,
                    "remarks": cs.get("remarks") or None,
                    "uhf_cb": _to_bool(cs.get("uhf_cb", False)),
                    "vhf_cb": _to_bool(cs.get("vhf_cb", False)),
                    "elba_cb": _to_bool(cs.get("elba_cb", False)),
                    "polar_cb": _to_bool(cs.get("polar_cb", False)),
                    "desert_cb": _to_bool(cs.get("desert_cb", False)),
                    "maritime_cb": _to_bool(cs.get("maritime_cb", False)),
                    "jungle_cb": _to_bool(cs.get("jungle_cb", False)),
                    "light_cb": _to_bool(cs.get("light_cb", False)),
                    "fluores_cb": _to_bool(cs.get("fluores_cb", False)),
                    "cover_cb": _to_bool(cs.get("cover_cb", False)),
                    "number": cs.get("number") or None,
                    "capacity": cs.get("capacity") or None,
                    "color": cs.get("color") or None,
                },
            )
        counts["call_signs"] = CallSign.objects.count()

        # online_fpls
        for fpl in seed.get("online_fpls", []):
            OnlineFpl.objects.get_or_create(
                id=fpl.get("id"),
                defaults={
                    "call_sign": fpl.get("call_sign", ""),
                    "departure_from": fpl.get("departure_from", ""),
                    "destination_to": fpl.get("destination_to", ""),
                    "dep_time_utc": fpl.get("dep_time_utc", ""),
                    "date_of_flight": fpl.get("date_of_flight", ""),
                    "pilot_name": fpl.get("pilot_name", ""),
                    "mobile_number": fpl.get("mobile_number", ""),
                    "co_pilot_name": fpl.get("co_pilot_name") or None,
                    "cabin_name": fpl.get("cabin_name") or None,
                    "remarks": fpl.get("remarks") or None,
                    "dpfz_zzzz_place_name": fpl.get("dpfz_zzzz_place_name") or None,
                    "dpfz_zzzz_lat_long": fpl.get("dpfz_zzzz_lat_long") or None,
                    "drst_zzzz_place_name": fpl.get("drst_zzzz_place_name") or None,
                    "drst_zzzz_lat_long": fpl.get("drst_zzzz_lat_long") or None,
                },
            )
        counts["online_fpls"] = OnlineFpl.objects.count()

        # aircrafts, airports, pilots (empty in legacy; keep for completeness)
        counts["aircrafts"] = Aircraft.objects.count()
        counts["airports"] = Airport.objects.count()
        counts["pilots"] = Pilot.objects.count()

        self.stdout.write(self.style.SUCCESS("Seed complete:"))
        for table, n in counts.items():
            self.stdout.write(f"  {table}: {n}")
