"""JSON API views for FLIGHT CADENCE.

Mirror the legacy FastAPI behaviour:
- CSRF-exempt endpoints accepting application/json
- call-signs and online-fpls POST/PUT take camelCase payload
- aircrafts/airports/pilots take snake_case payload
- online-fpls has no DELETE
- call_signs model stores SQLite 0/1 booleans; created_at as YYYY-MM-DD HH:MM:SS
"""
import json
from datetime import datetime

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from .models import UserRecord, CallSign, OnlineFpl, Aircraft, Airport, Pilot

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_body(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except (json.JSONDecodeError, ValueError):
        return {}


def _model_to_dict(instance, fields):
    data = {}
    for field in fields:
        value = getattr(instance, field, None)
        if isinstance(value, datetime):
            value = value.strftime("%Y-%m-%d %H:%M:%S")
        data[field] = value
    return data


def _json_response(data, status=200):
    return JsonResponse(data, status=status, safe=False, json_dumps_params={"ensure_ascii": False})


def _error(message, status=400):
    return _json_response({"error": message}, status=status)


# ---------------------------------------------------------------------------
# Auth API
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(["POST"])
def api_login(request):
    """Authenticate either via admin/user presets or database UserRecord."""
    body = _parse_body(request)
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    role = body.get("role", "user")

    if role == "admin" and username == "admin" and password == "admin":
        request.session["auth"] = True
        request.session["auth_role"] = "admin"
        request.session["auth_user"] = "Alex Mercer"
        return _json_response({
            "access_token": "dummy_token_for_flightcadence",
            "token_type": "bearer",
            "role": "admin",
            "user": "Alex Mercer",
        })
    if role == "user" and username == "user" and password == "user":
        request.session["auth"] = True
        request.session["auth_role"] = "user"
        request.session["auth_user"] = "Alex Mercer"
        return _json_response({
            "access_token": "dummy_token_for_flightcadence",
            "token_type": "bearer",
            "role": "user",
            "user": "Alex Mercer",
        })

    # Check database UserRecord dynamically
    db_user = UserRecord.objects.filter(username=username, hashed_password=password, is_active=True).first()
    if db_user:
        actual_role = "admin" if db_user.is_superuser else "user"
        request.session["auth"] = True
        request.session["auth_role"] = actual_role
        parts = db_user.username.replace(".", " ").replace("_", " ").split()
        user_name = " ".join([p.capitalize() for p in parts]) or db_user.username
        request.session["auth_user"] = user_name
        return _json_response({
            "access_token": "dummy_token_for_flightcadence",
            "token_type": "bearer",
            "role": actual_role,
            "user": user_name,
        })

    return _error(f"Invalid credentials for {role} role.", status=401)


@csrf_exempt
@require_http_methods(["POST"])
def api_logout(request):
    request.session.flush()
    return _json_response({"message": "Logged out successfully"})


# ---------------------------------------------------------------------------
# Call Signs (camelCase payload)
# ---------------------------------------------------------------------------

_CALLSIGN_FIELDS = [
    "id", "call_sign", "flight_rule", "flight_type", "aircraft_type",
    "weight_category", "equipments", "departure", "dep_time",
    "date_of_flight", "speed", "level", "route", "destination",
    "total_flying_time", "alternate_1", "alternate_2", "dep_station",
    "dep_lat_long", "dest_station", "dest_lat_long", "alternate_station",
    "pilot_in_command", "mobile_no", "co_pilot", "cabin_crew",
    "endurance", "performance", "registration", "operator", "remarks",
    "uhf_cb", "vhf_cb", "elba_cb", "polar_cb", "desert_cb", "maritime_cb",
    "jungle_cb", "light_cb", "fluores_cb", "cover_cb", "number", "capacity",
    "color", "created_at",
]

# payload key -> model field (camelCase -> snake_case)
_CALLSIGN_MAPPING = {
    "callSign": "call_sign", "flightRule": "flight_rule", "flightType": "flight_type",
    "aircraftType": "aircraft_type", "wake": "weight_category", "equipment": "equipments",
    "departure": "departure", "depTime": "dep_time", "dateOfFlight": "date_of_flight",
    "speed": "speed", "level": "level", "route": "route",
    "destination": "destination", "totalFlyingTime": "total_flying_time",
    "alternate_1": "alternate_1", "alternate_2": "alternate_2",
    "depStation": "dep_station", "depLatLong": "dep_lat_long",
    "destStation": "dest_station", "destLatLong": "dest_lat_long",
    "alternate_station": "alternate_station", "pilotInCommand": "pilot_in_command",
    "mobileNo": "mobile_no", "coPilot": "co_pilot", "cabinCrew": "cabin_crew",
    "endurance": "endurance", "performance": "performance", "registration": "registration",
    "operator": "operator", "remarks": "remarks", "uhf_cb": "uhf_cb",
    "vhf_cb": "vhf_cb", "elba_cb": "elba_cb", "polar_cb": "polar_cb",
    "desert_cb": "desert_cb", "maritime_cb": "maritime_cb", "jungle_cb": "jungle_cb",
    "light_cb": "light_cb", "fluores_cb": "fluores_cb", "cover_cb": "cover_cb",
    "number": "number", "capacity": "capacity", "color": "color",
}

_BOOL_FIELDS = {
    "uhf_cb", "vhf_cb", "elba_cb", "polar_cb", "desert_cb", "maritime_cb",
    "jungle_cb", "light_cb", "fluores_cb", "cover_cb",
}


def _camel_to_bool(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in ("1", "true", "yes", "on")


def call_signs_list_create(request):
    if request.method == "GET":
        qs = CallSign.objects.all().order_by("id")
        return _json_response([_model_to_dict(c, _CALLSIGN_FIELDS) for c in qs])

    if request.method == "POST":
        data = _parse_body(request)
        kwargs = {}
        for payload_key, model_field in _CALLSIGN_MAPPING.items():
            if payload_key in data:
                val = data[payload_key]
                if model_field in _BOOL_FIELDS:
                    val = _camel_to_bool(val)
                kwargs[model_field] = val
        cs = CallSign(**kwargs)
        cs.save()
        return _json_response(_model_to_dict(cs, _CALLSIGN_FIELDS), status=201)

    return _error("Method not allowed", status=405)


def call_signs_detail(request, pk):
    try:
        cs = CallSign.objects.get(pk=pk)
    except CallSign.DoesNotExist:
        return _error("Call Sign not found", status=404)

    if request.method == "GET":
        return _json_response(_model_to_dict(cs, _CALLSIGN_FIELDS))

    if request.method == "PUT":
        data = _parse_body(request)
        for payload_key, model_field in _CALLSIGN_MAPPING.items():
            if payload_key in data:
                val = data[payload_key]
                if model_field in _BOOL_FIELDS:
                    val = _camel_to_bool(val)
                setattr(cs, model_field, val)
        cs.save()
        return _json_response(_model_to_dict(cs, _CALLSIGN_FIELDS))

    if request.method == "DELETE":
        cs.delete()
        return _json_response({"message": "Call Sign deleted successfully"})

    return _error("Method not allowed", status=405)


# ---------------------------------------------------------------------------
# Online FPLs (camelCase payload; no DELETE)
# ---------------------------------------------------------------------------

_ONLINEFPL_FIELDS = [
    "id", "call_sign", "departure_from", "destination_to", "dep_time_utc",
    "date_of_flight", "pilot_name", "mobile_number", "co_pilot_name",
    "cabin_name", "remarks", "dpfz_zzzz_place_name", "dpfz_zzzz_lat_long",
    "drst_zzzz_place_name", "drst_zzzz_lat_long", "created_at",
]

_ONLINEFPL_MAPPING = {
    "callSign": "call_sign", "from": "departure_from", "to": "destination_to",
    "departureTimeUtc": "dep_time_utc", "dateOfFlight": "date_of_flight",
    "pilotName": "pilot_name", "mobileNumber": "mobile_number",
    "coPilotName": "co_pilot_name", "cabinName": "cabin_name",
    "remarks": "remarks", "dpfz": "dpfz_zzzz_place_name",
    "dpfzLat": "dpfz_zzzz_lat_long", "drst": "drst_zzzz_place_name",
    "drstLat": "drst_zzzz_lat_long",
}


def online_fpls_list_create(request):
    if request.method == "GET":
        qs = OnlineFpl.objects.all().order_by("-id")
        return _json_response([_model_to_dict(f, _ONLINEFPL_FIELDS) for f in qs])

    if request.method == "POST":
        data = _parse_body(request)
        kwargs = {}
        for payload_key, model_field in _ONLINEFPL_MAPPING.items():
            if payload_key in data:
                kwargs[model_field] = data[payload_key]
        fpl = OnlineFpl(**kwargs)
        fpl.save()
        return _json_response(_model_to_dict(fpl, _ONLINEFPL_FIELDS), status=201)

    return _error("Method not allowed", status=405)


def online_fpls_detail(request, pk):
    try:
        fpl = OnlineFpl.objects.get(pk=pk)
    except OnlineFpl.DoesNotExist:
        return _error("Flight Plan not found", status=404)

    if request.method == "GET":
        return _json_response(_model_to_dict(fpl, _ONLINEFPL_FIELDS))

    if request.method == "PUT":
        data = _parse_body(request)
        for payload_key, model_field in _ONLINEFPL_MAPPING.items():
            if payload_key in data:
                setattr(fpl, model_field, data[payload_key])
        fpl.save()
        return _json_response(_model_to_dict(fpl, _ONLINEFPL_FIELDS))

    # online-fpls has no DELETE
    return _error("DELETE not supported for online-fpls", status=405)


# ---------------------------------------------------------------------------
# Aircrafts (snake_case payload)
# ---------------------------------------------------------------------------

_AIRCRAFT_FIELDS = [
    "id", "operator", "registration_number", "aircraft_type", "wake_category",
    "rcn_equipment_capabilities", "surveillance_equipment_capabilities", "pbn",
    "nav", "gps", "com", "selcal", "remarks", "created_at", "updated_at",
]

_AIRCRAFT_UPDATE_FIELDS = [
    "operator", "registration_number", "aircraft_type", "wake_category",
    "rcn_equipment_capabilities", "surveillance_equipment_capabilities",
    "pbn", "nav", "gps", "com", "selcal",
]


def aircrafts_list_create(request):
    if request.method == "GET":
        qs = Aircraft.objects.all().order_by("-id")
        return _json_response([_model_to_dict(a, _AIRCRAFT_FIELDS) for a in qs])

    if request.method == "POST":
        data = _parse_body(request)
        a = Aircraft(**{f: data.get(f) for f in _AIRCRAFT_UPDATE_FIELDS})
        a.save()
        return _json_response(_model_to_dict(a, _AIRCRAFT_FIELDS), status=201)

    return _error("Method not allowed", status=405)


def aircrafts_detail(request, pk):
    try:
        a = Aircraft.objects.get(pk=pk)
    except Aircraft.DoesNotExist:
        return _error("Aircraft not found", status=404)

    if request.method == "GET":
        return _json_response(_model_to_dict(a, _AIRCRAFT_FIELDS))

    if request.method == "PUT":
        data = _parse_body(request)
        for field in _AIRCRAFT_UPDATE_FIELDS:
            if field in data:
                setattr(a, field, data[field])
        a.save()
        return _json_response(_model_to_dict(a, _AIRCRAFT_FIELDS))

    if request.method == "DELETE":
        a.delete()
        return _json_response({"message": "Aircraft deleted successfully"})

    return _error("Method not allowed", status=405)


# ---------------------------------------------------------------------------
# Airports (snake_case payload)
# ---------------------------------------------------------------------------

_AIRPORT_FIELDS = [
    "id", "fir", "icao_code", "airport_name", "city", "country", "elevation",
    "transition_altitude", "aftn_addresses", "remarks", "created_at", "updated_at",
]

_AIRPORT_UPDATE_FIELDS = [
    "fir", "icao_code", "airport_name", "city", "country", "elevation",
    "transition_altitude", "aftn_addresses", "remarks",
]


def airports_list_create(request):
    if request.method == "GET":
        qs = Airport.objects.all().order_by("-id")
        return _json_response([_model_to_dict(a, _AIRPORT_FIELDS) for a in qs])

    if request.method == "POST":
        data = _parse_body(request)
        a = Airport(**{f: data.get(f) for f in _AIRPORT_UPDATE_FIELDS})
        a.save()
        return _json_response(_model_to_dict(a, _AIRPORT_FIELDS), status=201)

    return _error("Method not allowed", status=405)


def airports_detail(request, pk):
    try:
        a = Airport.objects.get(pk=pk)
    except Airport.DoesNotExist:
        return _error("Airport not found", status=404)

    if request.method == "GET":
        return _json_response(_model_to_dict(a, _AIRPORT_FIELDS))

    if request.method == "PUT":
        data = _parse_body(request)
        for field in _AIRPORT_UPDATE_FIELDS:
            if field in data:
                setattr(a, field, data[field])
        a.save()
        return _json_response(_model_to_dict(a, _AIRPORT_FIELDS))

    if request.method == "DELETE":
        a.delete()
        return _json_response({"message": "Airport deleted successfully"})

    return _error("Method not allowed", status=405)


# ---------------------------------------------------------------------------
# Pilots (snake_case payload)
# ---------------------------------------------------------------------------

_PILOT_FIELDS = [
    "id", "name", "license_number", "rank", "contact_number", "email",
    "base_station", "remarks", "created_at", "updated_at",
]

_PILOT_UPDATE_FIELDS = [
    "name", "license_number", "rank", "contact_number", "email",
    "base_station", "remarks",
]


def pilots_list_create(request):
    if request.method == "GET":
        qs = Pilot.objects.all().order_by("-id")
        return _json_response([_model_to_dict(p, _PILOT_FIELDS) for p in qs])

    if request.method == "POST":
        data = _parse_body(request)
        p = Pilot(**{f: data.get(f) for f in _PILOT_UPDATE_FIELDS})
        p.save()
        return _json_response(_model_to_dict(p, _PILOT_FIELDS), status=201)

    return _error("Method not allowed", status=405)


def pilots_detail(request, pk):
    try:
        p = Pilot.objects.get(pk=pk)
    except Pilot.DoesNotExist:
        return _error("Pilot not found", status=404)

    if request.method == "GET":
        return _json_response(_model_to_dict(p, _PILOT_FIELDS))

    if request.method == "PUT":
        data = _parse_body(request)
        for field in _PILOT_UPDATE_FIELDS:
            if field in data:
                setattr(p, field, data[field])
        p.save()
        return _json_response(_model_to_dict(p, _PILOT_FIELDS))

    if request.method == "DELETE":
        p.delete()
        return _json_response({"message": "Pilot deleted successfully"})

    return _error("Method not allowed", status=405)


# ---------------------------------------------------------------------------
# Misc API
# ---------------------------------------------------------------------------

@require_http_methods(["GET"])
def flights(request):
    return _json_response([
        {"id": "EF-102", "origin": "DEL", "destination": "DXB", "status": "In Flight"},
        {"id": "EF-554", "origin": "BOM", "destination": "LHR", "status": "Scheduled"},
        {"id": "EF-201", "origin": "SIN", "destination": "SYD", "status": "On Time"},
    ])
