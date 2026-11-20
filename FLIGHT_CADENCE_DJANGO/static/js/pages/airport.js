/*============================================================================
  FLIGHT CADENCE — Airport Management page module
============================================================================*/

const airport = (() => {
    let data = [];
    const form = document.getElementById("airportForm");
    const wrap = document.getElementById("airportFormWrap");
    const idInput = document.getElementById("airportId");
    const titleEl = document.getElementById("airportFormTitle");
    const saveText = document.getElementById("airportSaveText");
    const tableBody = document.getElementById("airportTableBody");
    const countEl = document.getElementById("airportCount");

    const fields = [
        "fir", "icao_code", "airport_name", "city", "country",
        "elevation", "transition_altitude", "aftn_addresses", "remarks",
    ];

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
        titleEl.textContent = "Create New Airport";
        saveText.textContent = "Process";
    }

    function render() {
        countEl.innerHTML = `<b>${data.length}</b> airports`;
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem">No airports available.</td></tr>`;
            return;
        }
        tableBody.innerHTML = data
            .map(
                (a) => `
            <tr data-id="${a.id}">
                <td style="color:var(--dash-muted)">${a.id}</td>
                <td style="font-weight:900;letter-spacing:0.05rem">${a.icao_code}</td>
                <td>${a.airport_name}</td>
                <td>${a.city || "-"}</td>
                <td>${a.fir || "-"}</td>
                <td>${a.country || "India"}</td>
                <td>${a.elevation || "-"}</td>
                <td>
                    <div style="display:flex;gap:0.5rem">
                        <button class="btn btn-dark btn-sm" style="padding:0.4375rem 0.75rem;display:flex;align-items:center;gap:0.375rem" onclick="airport.edit(${a.id})">
                            <svg class="icon icon-edit" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg> Edit
                        </button>
                        <button class="btn btn-danger btn-sm" style="padding:0.4375rem 0.75rem;display:flex;align-items:center;gap:0.375rem;background:transparent;border:1px solid var(--primary-red);color:var(--primary-red)" onclick="airport.remove(${a.id})">
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
            data = await API.get("/api/airports");
            render();
        } catch (e) {
            console.error("Failed to fetch airports:", e);
        }
    }

    function edit(id) {
        const item = data.find((a) => a.id === id);
        if (!item) return;
        idInput.value = item.id;
        fields.forEach((f) => {
            const el = form.elements[f];
            if (el) el.value = item[f] || "";
        });
        titleEl.textContent = "Edit Airport";
        saveText.textContent = "Update";
        wrap.style.display = "";
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function remove(id) {
        if (!window.confirm("Are you sure you want to delete this airport?")) return;
        try {
            await API.del(`/api/airports/${id}`);
            await load();
        } catch (e) {
            console.error(e);
            alert("Delete failed.");
        }
    }

    let isSaving = false;
    async function save(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (isSaving) return false;
        isSaving = true;
        const fd = new FormData(form);
        const payload = {};
        fields.forEach((f) => {
            payload[f] = fd.get(f) || "";
        });
        const id = idInput.value;
        try {
            if (id) {
                await API.put(`/api/airports/${id}`, payload);
            } else {
                await API.post("/api/airports", payload);
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
