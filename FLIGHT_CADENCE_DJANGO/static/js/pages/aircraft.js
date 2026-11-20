/*============================================================================
  FLIGHT CADENCE — Aircraft Management page module
============================================================================*/

const aircraft = (() => {
    let data = [];
    const form = document.getElementById("aircraftForm");
    const wrap = document.getElementById("aircraftFormWrap");
    const idInput = document.getElementById("aircraftId");
    const titleEl = document.getElementById("aircraftFormTitle");
    const saveText = document.getElementById("aircraftSaveText");
    const addBtn = document.getElementById("aircraftAddBtn");
    const searchInput = document.getElementById("aircraftSearch");
    const tableBody = document.getElementById("aircraftTableBody");
    const countEl = document.getElementById("aircraftCount");

    const fields = [
        "operator", "registration_number", "aircraft_type", "wake_category",
        "rcn_equipment_capabilities", "surveillance_equipment_capabilities",
        "pbn", "nav", "com", "selcal",
    ];

    function init(initial) {
        data = initial || [];
        render();
        if (searchInput) searchInput.addEventListener("input", () => render());
    }

    function toggleForm() {
        const hidden = wrap.style.display === "none";
        wrap.style.display = hidden ? "" : "none";
        if (hidden) resetForm();
    }

    function resetForm() {
        form.reset();
        idInput.value = "";
        titleEl.textContent = "Create New Aircraft Profile";
        saveText.textContent = "Process Fleet Entry";
    }

    function render() {
        const q = searchInput.value.toLowerCase();
        const filtered = data.filter(
            (a) =>
                (a.registration_number || "").toLowerCase().includes(q) ||
                (a.aircraft_type || "").toLowerCase().includes(q) ||
                (a.operator || "").toLowerCase().includes(q)
        );

        countEl.innerHTML = `<b>${filtered.length}</b> aircraft in database`;

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem">No aircraft matching your search.</td></tr>`;
            return;
        }

        tableBody.innerHTML = filtered
            .map(
                (a) => `
            <tr data-id="${a.id}">
                <td style="color:var(--dash-muted)">${a.id}</td>
                <td style="font-weight:800;color:var(--primary-red)">${a.operator || "-"}</td>
                <td style="font-weight:900;color:var(--text-dark);letter-spacing:0.05rem">${a.registration_number}</td>
                <td>${a.aircraft_type}</td>
                <td><span style="padding:0.2rem 0.6rem;background:var(--dash-input-bg);border-radius:0.25rem;font-size:0.75rem">${a.wake_category || "-"}</span></td>
                <td style="font-family:monospace;font-size:0.75rem;color:var(--dash-muted)">${a.rcn_equipment_capabilities || "-"}/${a.surveillance_equipment_capabilities || "-"}</td>
                <td>
                    <div style="display:flex;gap:0.5rem">
                        <button class="btn btn-dark btn-sm" style="padding:0.4375rem 0.75rem;display:flex;align-items:center;gap:0.375rem" onclick="aircraft.edit(${a.id})">
                            <svg class="icon icon-edit" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg> Edit
                        </button>
                        <button class="btn btn-danger btn-sm" style="padding:0.4375rem 0.75rem;display:flex;align-items:center;gap:0.375rem;background:transparent;border:1px solid var(--primary-red);color:var(--primary-red)" onclick="aircraft.remove(${a.id})">
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
            data = await API.get("/api/aircrafts");
            render();
        } catch (e) {
            console.error("Failed to fetch aircrafts:", e);
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
        titleEl.textContent = "Edit Aircraft Profile";
        saveText.textContent = "Update Profile";
        wrap.style.display = "";
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function remove(id) {
        if (!window.confirm("Are you sure you want to delete this aircraft?")) return;
        try {
            await API.del(`/api/aircrafts/${id}`);
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
                await API.put(`/api/aircrafts/${id}`, payload);
            } else {
                await API.post("/api/aircrafts", payload);
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
