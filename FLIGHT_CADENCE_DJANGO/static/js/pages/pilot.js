/*============================================================================
  FLIGHT CADENCE — Pilot Management page module
============================================================================*/

const pilot = (() => {
    let data = [];
    const form = document.getElementById("pilotForm");
    const wrap = document.getElementById("pilotFormWrap");
    const idInput = document.getElementById("pilotId");
    const titleEl = document.getElementById("pilotFormTitle");
    const saveText = document.getElementById("pilotSaveText");
    const tableBody = document.getElementById("pilotTableBody");
    const countEl = document.getElementById("pilotCount");

    const fields = [
        "name", "license_number", "rank", "contact_number", "email",
        "base_station", "remarks",
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
        titleEl.textContent = "Create New Crew Member";
        saveText.textContent = "Process";
    }

    function render() {
        countEl.innerHTML = `<b>${data.length}</b> pilots`;
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem">No pilots available.</td></tr>`;
            return;
        }
        tableBody.innerHTML = data
            .map(
                (p) => `
            <tr data-id="${p.id}">
                <td style="color:var(--dash-muted)">${p.id}</td>
                <td style="font-weight:800;color:var(--text-dark)">${p.name}</td>
                <td style="letter-spacing:0.05rem">${p.license_number}</td>
                <td>${p.rank || "-"}</td>
                <td>${p.contact_number || "-"}</td>
                <td>${p.email || "-"}</td>
                <td>${p.base_station || "-"}</td>
                <td>
                    <div style="display:flex;gap:0.5rem">
                        <button class="btn btn-dark btn-sm" style="padding:0.4375rem 0.75rem;display:flex;align-items:center;gap:0.375rem" onclick="pilot.edit(${p.id})">
                            <svg class="icon icon-edit" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg> Edit
                        </button>
                        <button class="btn btn-danger btn-sm" style="padding:0.4375rem 0.75rem;display:flex;align-items:center;gap:0.375rem;background:transparent;border:1px solid var(--primary-red);color:var(--primary-red)" onclick="pilot.remove(${p.id})">
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
            data = await API.get("/api/pilots");
            render();
        } catch (e) {
            console.error("Failed to fetch pilots:", e);
        }
    }

    function edit(id) {
        const item = data.find((p) => p.id === id);
        if (!item) return;
        idInput.value = item.id;
        fields.forEach((f) => {
            const el = form.elements[f];
            if (el) el.value = item[f] || "";
        });
        titleEl.textContent = "Edit Crew Member";
        saveText.textContent = "Update";
        wrap.style.display = "";
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function remove(id) {
        if (!window.confirm("Are you sure you want to delete this crew member?")) return;
        try {
            await API.del(`/api/pilots/${id}`);
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
                await API.put(`/api/pilots/${id}`, payload);
            } else {
                await API.post("/api/pilots", payload);
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
