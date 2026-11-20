"""Page views for FLIGHT CADENCE.

Session-based custom auth (not Django auth) accepting user/user and admin/admin
plus role selection, matching the legacy React app.
"""
from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View

from .models import UserRecord, Aircraft, Airport, Pilot, CallSign, OnlineFpl

# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def _require_auth(request):
    """Return True if the request has an active session auth."""
    return bool(request.session.get("auth"))


def _require_auth_redirect(request, redirect_to="login"):
    """Redirect to login if not authenticated."""
    if not _require_auth(request):
        messages.warning(request, "Please log in to access this page.")
        return redirect(redirect_to)
    return None


# ---------------------------------------------------------------------------
# Public pages (BEFORE login)
# ---------------------------------------------------------------------------

def landing(request):
    return render(request, "public/landing.html")


def trip_support(request):
    modules = [
        {
            "title": "Online FPL",
            "icon_name": "activity",
            "color": "#FF3B30",
            "features": [
                "Connected via AFTN to AAI Airports",
                "Receive FIC-ADC via SMS",
                "Stores Old Plans up to 1 year",
                "Easily Edit Old Plan & File in Seconds",
                "Revise Time Online or thru Dispatch SMS",
            ],
        },
        {
            "title": "NOTAMS",
            "icon_name": "map-pin",
            "color": "#007AFF",
            "features": [
                "Plots Notams on Google Aviation Map",
                "Decoded Notams of all Indian Airports",
                "New Notams Notifications via email",
                "Lookup for future dates Notams",
                "Check Notams for Routes, Watch Hours etc",
            ],
        },
        {
            "title": "WEATHER",
            "icon_name": "cloud",
            "color": "#5856D6",
            "features": [
                "Latest Decoded METAR, TAF & ATIS",
                "Updates via SMS during bad weather flights",
                "Upper Wind Temp Charts",
                "Local Area Forecasts",
                "Animated Satellite Images",
            ],
        },
        {
            "title": "FDTL",
            "icon_name": "clock",
            "color": "#FF9500",
            "features": [
                "For Fixed Wing, Helicopters & Cabin Crew",
                "Calculates for Domestic & Intl Flights",
                "Get last Take Off & Next Day earliest Take Off",
                "Predicts possible solution to avoid Violations",
                "Enter Flight Time Offline & auto sync via APP",
            ],
        },
        {
            "title": "NAV LOG",
            "icon_name": "file-text",
            "color": "#34C759",
            "features": [
                "Most Precise Fuel Burn Calculations",
                "Indicates Max & Min Fuel required",
                "Historical Winds of last 30 years Stored",
                "SID & STAR points included in Route check",
                "Customised for each Aircraft Performance",
            ],
        },
        {
            "title": "LOAD TRIM",
            "icon_name": "smartphone",
            "color": "#FF2D55",
            "features": [
                "Offline & Online Calculation thru APP",
                "Print out same as approved DGCA format",
                "Auto sync NAV LOG values to avoid entries",
                "Interactive C.G. Graph with rich insights",
                "User friendly design that outputs in seconds",
            ],
        },
    ]
    return render(request, "public/trip_support.html", {"modules": modules})


def airports_public(request):
    """Redirect legacy public airports URL to protected airport management."""
    return redirect("airport_management")


def about(request):
    values = [
        {
            "title": "Quality",
            "desc": "We strive for continuous quality improvement in all that we do.",
            "icon_name": "award",
            "color": "#FF3B30",
        },
        {
            "title": "Ambition",
            "desc": "We are ambitious both professionally and personally.",
            "icon_name": "zap",
            "color": "#007AFF",
        },
        {
            "title": "Responsibility",
            "desc": "We are responsible in every sense – towards work, environment and clients.",
            "icon_name": "shield",
            "color": "#34C759",
        },
        {
            "title": "Cooperation",
            "desc": "We cooperate bringing out the best in each other and creating strong and successful working relationships.",
            "icon_name": "users",
            "color": "#FF9500",
        },
        {
            "title": "Trust",
            "desc": "We want an open, honest and realistic relationship with our customers, suppliers and each other.",
            "icon_name": "heart",
            "color": "#FF2D55",
        },
        {
            "title": "Innovation",
            "desc": "We aim to innovate, not replicate, and to address tomorrow's challenges today.",
            "icon_name": "sparkles",
            "color": "#5856D6",
        },
    ]
    return render(request, "public/about.html", {"values": values})


def pricing(request):
    plans = [
        {
            "name": "Basic",
            "desc": "Essential digital toolkit for private pilots and hobbyists.",
            "color": "#34C759",
            "featured": False,
            "icon_name": "zap",
            "features": [
                "Online Flight Planning",
                "FIC-ADC via SMS",
                "iOS & Android Mobile APP",
                "Notams on Maps",
                "Weather Decoded",
                "FDTL Offline Calculator",
            ],
        },
        {
            "name": "Starter",
            "desc": "Optimized for high-efficiency charter operations.",
            "color": "var(--primary-red)",
            "featured": True,
            "icon_name": "plane",
            "features": [
                "All Basic Plan Features Plus",
                "NAV LOG based on latest Winds",
                "Unlimited Test Plans",
                "Load Trim (Approved Format)",
                "Offline Load Trim in APP",
                "24 x 7 Dispatch Support",
            ],
        },
        {
            "name": "Professional",
            "desc": "Expert-grade tools for complex flight missions.",
            "color": "var(--primary-blue, #007AFF)",
            "featured": False,
            "icon_name": "shield",
            "features": [
                "All Starter Plan Features Plus",
                "APG Runway Analysis",
                "Single Engine Procedure",
                "8,500 Worldwide Airports",
                "iPAD APP",
                "24 x 7 Dispatch Support",
            ],
        },
        {
            "name": "Premium",
            "desc": "The ultimate enterprise solution for major fleets.",
            "color": "#5856D6",
            "featured": False,
            "icon_name": "star",
            "features": [
                "All Professional Plan Features Plus",
                "Login Access to 2 Pilots",
                "Perform NAV LOG, LOAD TRIM",
                "Check RUNWAY ANALYSIS",
                "Dedicated Manager",
                "24 x 7 Dispatch Support",
            ],
        },
    ]
    return render(request, "public/pricing.html", {"plans": plans})


def contact(request):
    return render(request, "public/contact.html")


# ---------------------------------------------------------------------------
# Auth pages
# ---------------------------------------------------------------------------

def login_view(request):
    """Custom login: user/user -> /online-fpl, admin/admin -> /dashboard."""
    if _require_auth(request):
        role = request.session.get("auth_role", "user")
        return redirect("/dashboard" if role == "admin" else "/online-fpl")

    selected_role = request.GET.get("role", "user")

    if request.method == "POST":
        username = (request.POST.get("username") or "").strip()
        password = request.POST.get("password") or ""
        role = request.POST.get("role", "user")

        if role == "admin" and username == "admin" and password == "admin":
            request.session["auth"] = True
            request.session["auth_role"] = "admin"
            request.session["auth_user"] = "Alex Mercer"
            return redirect("/dashboard")
        elif role == "user" and username == "user" and password == "user":
            request.session["auth"] = True
            request.session["auth_role"] = "user"
            request.session["auth_user"] = "Alex Mercer"
            return redirect("/online-fpl")
        else:
            db_user = UserRecord.objects.filter(username=username, hashed_password=password, is_active=True).first()
            if db_user:
                actual_role = "admin" if db_user.is_superuser else "user"
                request.session["auth"] = True
                request.session["auth_role"] = actual_role
                parts = db_user.username.replace(".", " ").replace("_", " ").split()
                user_name = " ".join([p.capitalize() for p in parts]) or db_user.username
                request.session["auth_user"] = user_name
                return redirect("/dashboard" if actual_role == "admin" else "/online-fpl")
            messages.error(request, f"Invalid credentials for {role} role.")

    return render(request, "auth/login.html", {"selected_role": selected_role})


def register_view(request):
    """Register page (secret key flightcadence@2026 creates admin)."""
    if request.method == "POST":
        full_name = (request.POST.get("full_name") or "").strip()
        company_name = (request.POST.get("company_name") or "").strip()
        email = (request.POST.get("email") or "").strip()
        username = (request.POST.get("username") or "").strip()
        password = request.POST.get("password") or ""
        confirm_password = request.POST.get("confirm_password") or ""
        secret_key = request.POST.get("secret_key") or ""

        if secret_key != "flightcadence@2026":
            messages.error(request, "Invalid Secret Key! You are not authorized to create an Admin account.")
            return render(request, "auth/register.html")
        if password != confirm_password:
            messages.error(request, "Passwords do not match!")
            return render(request, "auth/register.html")
        if UserRecord.objects.filter(username=username).exists():
            messages.error(request, "Username already exists.")
            return render(request, "auth/register.html")
        if UserRecord.objects.filter(email=email).exists():
            messages.error(request, "Email already exists.")
            return render(request, "auth/register.html")

        UserRecord.objects.create(
            username=username,
            email=email,
            hashed_password=password,
            is_active=True,
            is_superuser=True,
        )
        messages.success(request, "Account created successfully. Please log in.")
        return redirect("login")

    return render(request, "auth/register.html")


def forgot_password(request):
    return render(request, "auth/forgot_password.html")


def logout_view(request):
    request.session.flush()
    messages.info(request, "You have been logged out.")
    return redirect("/")


# ---------------------------------------------------------------------------
# App pages (AFTER login)
# ---------------------------------------------------------------------------

def _dashboard_context(request):
    return {
        "page_title": "Dashboard",
        "section": "dashboard",
    }


def dashboard(request):
    redirect_resp = _require_auth_redirect(request)
    if redirect_resp:
        return redirect_resp
    return render(request, "app/dashboard.html", {
        **_dashboard_context(request),
        "call_signs": CallSign.objects.all(),
        "online_fpls": OnlineFpl.objects.all(),
    })


def profile(request):
    redirect_resp = _require_auth_redirect(request)
    if redirect_resp:
        return redirect_resp
    return render(request, "app/profile.html", _dashboard_context(request))


def aircraft_management(request):
    redirect_resp = _require_auth_redirect(request)
    if redirect_resp:
        return redirect_resp
    aircrafts = Aircraft.objects.all().order_by("-id")
    return render(request, "app/aircraft_management.html", {
        **_dashboard_context(request),
        "aircrafts": aircrafts,
        "aircrafts_json": list(aircrafts.values()),
    })


def airport_management(request):
    redirect_resp = _require_auth_redirect(request)
    if redirect_resp:
        return redirect_resp
    airports = Airport.objects.all().order_by("-id")
    return render(request, "app/airport_management.html", {
        **_dashboard_context(request),
        "airports": airports,
        "airports_json": list(airports.values()),
    })


def pilot_management(request):
    redirect_resp = _require_auth_redirect(request)
    if redirect_resp:
        return redirect_resp
    pilots = Pilot.objects.all().order_by("-id")
    return render(request, "app/pilot_management.html", {
        **_dashboard_context(request),
        "pilots": pilots,
        "pilots_json": list(pilots.values()),
    })


def online_fpl(request):
    redirect_resp = _require_auth_redirect(request)
    if redirect_resp:
        return redirect_resp
    call_signs_qs = CallSign.objects.all().order_by("id")
    online_fpls_qs = OnlineFpl.objects.all().order_by("-id")
    return render(request, "app/online_fpl.html", {
        **_dashboard_context(request),
        "call_signs": call_signs_qs,
        "online_fpls": online_fpls_qs,
        "call_signs_json": list(call_signs_qs.values()),
        "online_fpls_json": list(online_fpls_qs.values()),
    })


def call_signs(request):
    redirect_resp = _require_auth_redirect(request)
    if redirect_resp:
        return redirect_resp
    call_signs_qs = CallSign.objects.all().order_by("-id")
    return render(request, "app/call_signs.html", {
        **_dashboard_context(request),
        "call_signs": call_signs_qs,
        "call_signs_json": list(call_signs_qs.values()),
    })


def notams(request):
    redirect_resp = _require_auth_redirect(request)
    if redirect_resp:
        return redirect_resp
    return render(request, "app/under_development.html", {
        **_dashboard_context(request),
        "module_title": "NOTAMs Management",
        "module_description": "Notice to Air Missions briefing and real-time aerodrome notices.",
    })


def weather(request):
    redirect_resp = _require_auth_redirect(request)
    if redirect_resp:
        return redirect_resp
    return render(request, "app/under_development.html", {
        **_dashboard_context(request),
        "module_title": "Aviation Weather",
        "module_description": "METAR, TAF, SIGMET and satellite weather radar forecasts.",
    })


def nav_log(request):
    redirect_resp = _require_auth_redirect(request)
    if redirect_resp:
        return redirect_resp
    return render(request, "app/under_development.html", {
        **_dashboard_context(request),
        "module_title": "Navigation Log",
        "module_description": "Automated flight waypoint compute and fuel burn nav-log.",
    })


def pdf_edit(request):
    redirect_resp = _require_auth_redirect(request)
    if redirect_resp:
        return redirect_resp
    return render(request, "app/under_development.html", {
        **_dashboard_context(request),
        "module_title": "PDF Editor Tool",
        "module_description": "Aviation PDF document annotation and operational form editing.",
    })


def pdf_merge(request):
    redirect_resp = _require_auth_redirect(request)
    if redirect_resp:
        return redirect_resp
    return render(request, "app/under_development.html", {
        **_dashboard_context(request),
        "module_title": "PDF Merge Tool",
        "module_description": "Batch merge flight plan briefings, weather charts, and manifest files.",
    })


def scrape_form(request):
    redirect_resp = _require_auth_redirect(request)
    if redirect_resp:
        return redirect_resp
    return render(request, "app/under_development.html", {
        **_dashboard_context(request),
        "module_title": "Scrape Form",
        "module_description": "Aviation data extraction and automated airport schedule scraper.",
    })


def route_plan(request):
    redirect_resp = _require_auth_redirect(request)
    if redirect_resp:
        return redirect_resp
    return render(request, "app/under_development.html", {
        **_dashboard_context(request),
        "module_title": "Route Plan",
        "module_description": "Airway routing calculation, wind optimization, and alternate aerodrome selection.",
    })


# ---------------------------------------------------------------------------
# Admin pages
# ---------------------------------------------------------------------------

def users_management(request):
    redirect_resp = _require_auth_redirect(request)
    if redirect_resp:
        return redirect_resp
    if request.session.get("auth_role") != "admin":
        messages.error(request, "Admin access required.")
        return redirect("/dashboard")

    if request.method == "POST":
        action = request.POST.get("action", "create")
        if action == "create":
            name = (request.POST.get("name") or "").strip()
            username = (request.POST.get("username") or "").strip()
            password = request.POST.get("password") or "crew123"
            phone = (request.POST.get("phone") or "").strip()
            address = (request.POST.get("address") or "").strip()
            role_level = request.POST.get("roleLevel", "Standard Crew")

            if not username:
                messages.error(request, "Username is required.")
            elif UserRecord.objects.filter(username=username).exists():
                messages.error(request, f"User with username '{username}' already exists.")
            else:
                email = f"{username.lower().replace(' ', '.')}@flightcadence.com"
                is_admin = role_level in ["Dispatch Officer", "Senior Pilot"]
                UserRecord.objects.create(
                    username=username,
                    email=email,
                    hashed_password=password,
                    is_active=True,
                    is_superuser=is_admin,
                )
                messages.success(request, f"Credentials issued successfully for {name or username}.")
            return redirect("users_management")

        elif action == "delete":
            user_id = request.POST.get("user_id")
            if user_id:
                UserRecord.objects.filter(id=user_id).delete()
                messages.success(request, "User account successfully deleted.")
            return redirect("users_management")

        elif action == "toggle_status":
            user_id = request.POST.get("user_id")
            if user_id:
                u = UserRecord.objects.filter(id=user_id).first()
                if u:
                    u.is_active = not u.is_active
                    u.save()
                    messages.success(request, f"Status updated for {u.username}.")
            return redirect("users_management")

    users_qs = UserRecord.objects.all().order_by("-id")
    plans_map = {1: 142, 2: 89, 3: 215, 4: 34}
    user_list = []
    for u in users_qs:
        parts = u.username.replace(".", " ").replace("_", " ").split()
        display_name = " ".join([p.capitalize() for p in parts]) or u.username
        plans_count = plans_map.get(u.id, (u.id * 37) % 220 + 20)
        status_text = "Active" if u.is_active else "Offline"
        user_list.append({
            "id": f"EMP-{str(u.id).zfill(3)}",
            "raw_id": u.id,
            "name": display_name,
            "username": u.username,
            "email": u.email,
            "status": status_text,
            "is_active": u.is_active,
            "is_superuser": u.is_superuser,
            "plans_filed": plans_count,
            "last_active": "10 mins ago" if u.is_active else "Yesterday",
        })

    return render(request, "app/users_management.html", {
        **_dashboard_context(request),
        "users": user_list,
    })


def system_settings(request):
    redirect_resp = _require_auth_redirect(request)
    if redirect_resp:
        return redirect_resp
    if request.session.get("auth_role") != "admin":
        messages.error(request, "Admin access required.")
        return redirect("/dashboard")
    return render(request, "app/system_settings.html", _dashboard_context(request))
