/*============================================================================
  FLIGHT CADENCE — Shared API client
  Mirrors the legacy FastAPI backend on the same origin (Django, port 8001).
  All endpoints are CSRF-exempt and accept/send application/json.
============================================================================*/

const API = (() => {
    const BASE = "";

    // Read CSRF token from cookie (Django sets csrftoken when middleware runs).
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(";").shift();
        return null;
    }

    async function request(path, { method = "GET", body, headers = {} } = {}) {
        const opts = {
            method,
            headers: { "Accept": "application/json", ...headers },
            credentials: "same-origin",
        };
        if (body && !(body instanceof FormData)) {
            opts.body = JSON.stringify(body);
            opts.headers["Content-Type"] = "application/json";
        }
        // Django CSRF: send X-CSRFToken for non-GET same-origin requests.
        const token = getCookie("csrftoken");
        if (token && method !== "GET") {
            opts.headers["X-CSRFToken"] = token;
        }

        const res = await fetch(BASE + path, opts);
        let data;
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
            data = await res.json();
        } else {
            data = { ok: res.ok, status: res.status, text: await res.text() };
        }
        if (!res.ok) {
            const err = new Error(data.error || `Request failed (${res.status})`);
            err.status = res.status;
            err.data = data;
            throw err;
        }
        return data;
    }

    return {
        get: (path) => request(path, { method: "GET" }),
        post: (path, body) => request(path, { method: "POST", body }),
        put: (path, body) => request(path, { method: "PUT", body }),
        del: (path) => request(path, { method: "DELETE" }),
        postForm: (path, formData) =>
            request(path, { method: "POST", body: formData }),
    };
})();

if (typeof window !== "undefined") {
    window.API = API;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
}
