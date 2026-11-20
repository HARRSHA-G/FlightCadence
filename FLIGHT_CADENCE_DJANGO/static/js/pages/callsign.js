/*============================================================================
  FLIGHT CADENCE — Call Signs page module (camelCase payload)
============================================================================*/

const callsign = (() => {
    let data = [];
    const form = document.getElementById("csForm");
    const wrap = document.getElementById("csFormWrap");
    const idInput = document.getElementById("csId");
    const titleEl = document.getElementById("csFormTitle");
    const saveText = document.getElementById("csSaveText");
    const tableBody = document.getElementById("csTableBody");
    const countEl = document.getElementById("csCount");

    // model (snake_case) -> payload (camelCase)
    const SNAKE_TO_CAMEL = {
        call_sign: "callSign", flight_rule: "flightRule", flight_type: "flightType",
        aircraft_type: "aircraftType", weight_category: "wake", equipments: "equipment",
        departure: "departure", dep_time: "depTime", date_of_flight: "dateOfFlight",
        speed: "speed", level: "level", route: "route", destination: "destination",
        total_flying_time: "totalFlyingTime", alternate_1: "alternate_1",
        alternate_2: "alternate_2", dep_station: "depStation", dep_lat_long: "depLatLong",
        dest_station: "destStation", dest_lat_long: "destLatLong",
        alternate_station: "alternate_station", pilot_in_command: "pilotInCommand",
        mobile_no: "mobileNo", co_pilot: "coPilot", cabin_crew: "cabinCrew",
        endurance: "endurance", performance: "performance", registration: "registration",
        operator: "operator", remarks: "remarks", uhf_cb: "uhf_cb", vhf_cb: "vhf_cb",
        elba_cb: "elba_cb", polar_cb: "polar_cb", desert_cb: "desert_cb",
        maritime_cb: "maritime_cb", jungle_cb: "jungle_cb", light_cb: "light_cb",
        fluores_cb: "fluores_cb", cover_cb: "cover_cb", number: "number",
        capacity: "capacity", color: "color",
    };
    const BOOL_FIELDS = new Set([
        "uhf_cb","vhf_cb","elba_cb","polar_cb","desert_cb","maritime_cb",
        "jungle_cb","light_cb","fluores_cb","cover_cb",
    ]);

    const TEXT_FIELDS = Object.keys(SNAKE_TO_CAMEL).filter((k) => !BOOL_FIELDS.has(k));

    function init(initial) {
        data = initial || [];
        render();
    }

    function toggleForm() {
        const hidden = wrap.style.display === "none";
        wrap.style.display = hidden ? "" : "none";
        if (hidden) resetForm();
    }

    function resetForm() {
        form.reset();
        idInput.value = "";
        titleEl.textContent = "Create New Call Sign";
        saveText.textContent = "Process";
    }

    function render() {
        countEl.innerHTML = `<b>${data.length}</b> records`;
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:2rem">No call sign records.</td></tr>`;
            return;
        }
        tableBody.innerHTML = data
            .map(
                (c) => `
            <tr data-id="${c.id}">
                <td style="color:var(--dash-muted)">${c.id}</td>
                <td style="font-weight:900;letter-spacing:0.05rem;color:var(--primary-red)">${c.call_sign}</td>
                <td>${c.flight_rule}</td>
                <td>${c.flight_type}</td>
                <td>${c.aircraft_type}</td>
                <td>${c.departure}</td>
                <td>${c.destination}</td>
                <td>${c.date_of_flight}</td>
                <td>
                    <div style="display:flex;gap:0.5rem">
                        <button class="btn btn-dark btn-sm" style="padding:0.4375rem 0.75rem;display:flex;align-items:center;gap:0.375rem" onclick="callsign.edit(${c.id})">
                            <svg class="icon icon-edit" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg> Edit
                        </button>
                        <button class="btn btn-danger btn-sm" style="padding:0.4375rem 0.75rem;display:flex;align-items:center;gap:0.375rem;background:transparent;border:1px solid var(--primary-red);color:var(--primary-red)" onclick="callsign.remove(${c.id})">
                            <svg class="icon icon-trash" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><polyline points="8 6 8 14 14 14"></polyline></svg> Del
                        </button>
                    </div>
                </td>
            </tr>
        `
            )
            .join("");
    }

    async function load() {
        try {
            data = await API.get("/api/call-signs");
            render();
        } catch (e) {
            console.error("Failed to fetch call signs:", e);
        }
    }

    function toCamel(obj) {
        const out = {};
        TEXT_FIELDS.forEach((k) => { out[SNAKE_TO_CAMEL[k]] = obj[k] || ""; });
        BOOL_FIELDS.forEach((k) => { out[SNAKE_TO_CAMEL[k]] = !!obj[k]; });
        return out;
    }

    function edit(id) {
        const item = data.find((c) => c.id === id);
        if (!item) return;
        idInput.value = item.id;
        const camel = toCamel(item);
        TEXT_FIELDS.forEach((k) => {
            const el = form.elements[SNAKE_TO_CAMEL[k]];
            if (el) el.value = camel[SNAKE_TO_CAMEL[k]];
        });
        BOOL_FIELDS.forEach((k) => {
            const el = form.elements[SNAKE_TO_CAMEL[k]];
            if (el) el.checked = !!camel[SNAKE_TO_CAMEL[k]];
        });
        titleEl.textContent = "Edit Call Sign";
        saveText.textContent = "Update";
        wrap.style.display = "";
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function remove(id) {
        if (!window.confirm("Are you sure you want to delete this call sign?")) return;
        try {
            await API.del(`/api/call-signs/${id}`);
            await load();
        } catch (e) {
            console.error(e);
            alert("Delete failed.");
        }
    }

    function collectPayload() {
        const fd = new FormData(form);
        const payload = {};
        TEXT_FIELDS.forEach((k) => {
            const val = fd.get(SNAKE_TO_CAMEL[k]);
            if (val !== null) payload[SNAKE_TO_CAMEL[k]] = val;
        });
        BOOL_FIELDS.forEach((k) => {
            payload[SNAKE_TO_CAMEL[k]] = fd.get(SNAKE_TO_CAMEL[k]) === "1";
        });
        return payload;
    }

    let isSaving = false;
    async function save(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (isSaving) return false;
        isSaving = true;
        const payload = collectPayload();
        const id = idInput.value;
        try {
            if (id) {
                await API.put(`/api/call-signs/${id}`, payload);
            } else {
                await API.post("/api/call-signs", payload);
            }
            resetForm();
            wrap.style.display = "none";
            await load();
        } catch (e) {
            console.error(e);
            alert("Save failed: " + (e.data && e.data.error ? e.data.error : e.message));
        } finally {
            isSaving = false;
        }
        return false;
    }

    return { init, toggleForm, resetForm, edit, remove, save, load };
})();
