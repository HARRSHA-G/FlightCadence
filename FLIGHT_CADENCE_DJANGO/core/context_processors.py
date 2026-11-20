def session_context(request):
    return {
        "is_authed": bool(request.session.get("auth")),
        "auth_role": request.session.get("auth_role", "user"),
        "auth_user": request.session.get("auth_user", "Alex Mercer"),
    }
