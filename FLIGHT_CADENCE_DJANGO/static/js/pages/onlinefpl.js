/*============================================================================
  FLIGHT CADENCE — Online FPL page module (camelCase payload + PDF)
============================================================================*/

const fpl = (() => {
    let backendCallSigns = [];
    let fpls = [];
    let activeFilters = { callSign: "", depAerodrome: "", destAerodrome: "", fromDate: "", toDate: "" };

    const form = document.getElementById("fplForm");
    const wrap = document.getElementById("fplFormWrap");
    const idInput = form.elements["id"];
    const tableBody = document.getElementById("fplTableBody");
    const countEl = document.getElementById("fplCount");

    const FIELDS = [
        "callSign", "from", "to", "departureTimeUtc", "dateOfFlight",
        "pilotName", "mobileNumber", "coPilotName", "cabinName", "remarks",
        "dpfz", "dpfzLat", "drst", "drstLat",
    ];

    function init(csBackend, fplList) {
        backendCallSigns = csBackend || [];
        fpls = fplList || [];
        renderTable();
        wireFilters();
        if (form) form.onsubmit = (e) => saveAndPdf(e);
    }

    function toggleForm() {
        const hidden = wrap.style.display === "none";
        wrap.style.display = hidden ? "" : "none";
        if (hidden) resetForm();
    }

    function resetForm() {
        form.reset();
        idInput.value = "";
        document.getElementById("fplFormTitle").textContent = "Create New Flight Plan";
    }

    function autofill() {
        const csInput = form.elements["callSign"];
        if (!csInput.value.trim()) return;
        const matched = backendCallSigns.find(
            (c) => c.call_sign && c.call_sign.toUpperCase() === csInput.value.trim().toUpperCase()
        );
        if (!matched) {
            alert("Call sign not found. Please create the Call Sign profile first!");
            return;
        }
        form.elements["from"].value = matched.departure_from || matched.departure || "";
        form.elements["to"].value = matched.destination_to || matched.destination || "";
        form.elements["departureTimeUtc"].value = (matched.dep_time_utc || matched.dep_time || "").replace(":", "");
        form.elements["dateOfFlight"].value = matched.date_of_flight || matched.dateOfFlight || "";
        form.elements["pilotName"].value = matched.pilot_name || matched.pilot_in_command || "";
        form.elements["mobileNumber"].value = matched.mobile_number || matched.mobile_no || "";
        form.elements["coPilotName"].value = matched.co_pilot_name || matched.co_pilot || "";
        form.elements["cabinName"].value = matched.cabin_name || matched.cabin_crew || "";
        form.elements["remarks"].value = matched.remarks || "";
        form.elements["dpfz"].value = matched.dpfz_zzzz_place_name || matched.dep_station || "";
        form.elements["dpfzLat"].value = matched.dpfz_zzzz_lat_long || matched.dep_lat_long || "";
        form.elements["drst"].value = matched.drst_zzzz_place_name || matched.dest_station || "";
        form.elements["drstLat"].value = matched.drst_zzzz_lat_long || matched.dest_lat_long || "";
    }

    let isSaving = false;
    async function saveAndPdf(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (isSaving) return false;
        isSaving = true;
        const payload = {};
        FIELDS.forEach((k) => {
            const el = form.elements[k];
            payload[k] = el ? el.value : "";
        });
        const id = idInput ? idInput.value : "";
        try {
            if (id) {
                await API.put(`/api/online-fpls/${id}`, payload);
            } else {
                await API.post("/api/online-fpls", payload);
            }
            await load();
            toggleForm();
            // small delay lets DOM settle before pdf capture
            setTimeout(() => generatePdfFromPayload(payload), 150);
        } catch (err) {
            console.error(err);
            alert("Save failed: " + (err.data && err.data.error ? err.data.error : err.message));
        } finally {
            isSaving = false;
        }
        return false;
    }

    async function load() {
        try {
            fpls = await API.get("/api/online-fpls");
            renderTable();
        } catch (e) {
            console.error("Failed to fetch FPLs:", e);
        }
    }

    function rowDate(item) {
        const d = item.date_of_flight || "";
        return d.substring(5) || "12-MAR";
    }

    function renderTable() {
        const cs = activeFilters.callSign.trim().toLowerCase();
        const dep = activeFilters.depAerodrome.trim().toLowerCase();
        const dest = activeFilters.destAerodrome.trim().toLowerCase();
        const fromD = activeFilters.fromDate;
        const toD = activeFilters.toDate;
        const monthInfo = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };

        let rows = fpls.slice().reverse().map((item) => ({
            id: item.id,
            date: rowDate(item),
            callSign: item.call_sign || "N/A",
            depTimeUtc: item.dep_time_utc || "0000",
            fr: "FIC",
            adc: "ADC",
            n: "",
            f: item.departure_from || "N/A",
            to: item.destination_to || "N/A",
            _full: item,
        }));

        rows = rows.filter((r) => {
            if (cs && !r.callSign.toLowerCase().includes(cs)) return false;
            if (dep && !r.f.toLowerCase().includes(dep)) return false;
            if (dest && !r.to.toLowerCase().includes(dest)) return false;
            if (fromD || toD) {
                const parts = r.date.split("-");
                if (parts.length === 2) {
                    const day = parseInt(parts[0], 10);
                    const month = monthInfo[parts[1].toUpperCase()];
                    if (month === undefined) return true;
                    const rowDateObj = new Date(new Date().getFullYear(), month, day);
                    if (fromD) {
                        const fd = new Date(fromD); fd.setHours(0, 0, 0, 0);
                        if (rowDateObj < fd) return false;
                    }
                    if (toD) {
                        const td = new Date(toD); td.setHours(23, 59, 59, 999);
                        if (rowDateObj > td) return false;
                    }
                }
            }
            return true;
        });

        countEl.innerHTML = `Showing <b>${rows.length}</b> of <b>${fpls.length}</b>`;
        if (rows.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="10" style="padding:1.5rem;color:var(--dash-muted)">No records match your search.</td></tr>`;
            return;
        }
        tableBody.innerHTML = rows
            .map(
                (r) => `
            <tr>
                <td style="color:var(--dash-muted)">${r.id}</td>
                <td>${r.date}</td>
                <td style="font-weight:900;color:var(--text-dark)">${r.callSign}</td>
                <td>${r.depTimeUtc}</td>
                <td>${r.fr}</td>
                <td>${r.adc}</td>
                <td>${r.n || "-"}</td>
                <td style="color:var(--dash-muted)">${r.f}</td>
                <td>${r.to}</td>
                <td>
                    <div style="display:flex;gap:0.375rem;align-items:center">
                        <button class="btn btn-primary" style="padding:0.4375rem 0.75rem;font-size:0.6875rem;display:flex;align-items:center;gap:0.25rem" onclick="fpl.editAndPdf(${r.id})">
                            ${r.action}
                        </button>
                        <button style="background:transparent;border:1px solid var(--primary-red);color:var(--primary-red);padding:0.4375rem;border-radius:0.375rem;display:flex;align-items:center;cursor:pointer" title="Download FPL PDF" onclick="fpl.downloadRowPdf(${r.id})">
                            <svg class="icon icon-download-cloud" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `
            )
            .join("");
    }

    function wireFilters() {
        document.getElementById("fplFilterCallSign").addEventListener("input", (e) => { activeFilters.callSign = e.target.value; });
        document.getElementById("fplFilterDep").addEventListener("input", (e) => { activeFilters.depAerodrome = e.target.value; });
        document.getElementById("fplFilterDest").addEventListener("input", (e) => { activeFilters.destAerodrome = e.target.value; });
        document.getElementById("fplFilterFrom").addEventListener("input", (e) => { activeFilters.fromDate = e.target.value; });
        document.getElementById("fplFilterTo").addEventListener("input", (e) => { activeFilters.toDate = e.target.value; });
    }

    function applyFilters() { renderTable(); }
    function clearFilters() {
        activeFilters = { callSign: "", depAerodrome: "", destAerodrome: "", fromDate: "", toDate: "" };
        document.getElementById("fplFilterCallSign").value = "";
        document.getElementById("fplFilterDep").value = "";
        document.getElementById("fplFilterDest").value = "";
        document.getElementById("fplFilterFrom").value = "";
        document.getElementById("fplFilterTo").value = "";
        renderTable();
    }

    function editAndPdf(id) {
        const item = fpls.find((f) => f.id === id);
        if (!item) return;
        idInput.value = item.id;
        form.elements["callSign"].value = item.call_sign || "";
        form.elements["from"].value = item.departure_from || "";
        form.elements["to"].value = item.destination_to || "";
        form.elements["departureTimeUtc"].value = item.dep_time_utc || "";
        form.elements["dateOfFlight"].value = item.date_of_flight || "";
        form.elements["pilotName"].value = item.pilot_name || "";
        form.elements["mobileNumber"].value = item.mobile_number || "";
        form.elements["coPilotName"].value = item.co_pilot_name || "";
        form.elements["cabinName"].value = item.cabin_name || "";
        form.elements["remarks"].value = item.remarks || "";
        form.elements["dpfz"].value = item.dpfz_zzzz_place_name || "";
        form.elements["dpfzLat"].value = item.dpfz_zzzz_lat_long || "";
        form.elements["drst"].value = item.drst_zzzz_place_name || "";
        form.elements["drstLat"].value = item.drst_zzzz_lat_long || "";
        document.getElementById("fplFormTitle").textContent = "Edit Flight Plan";
        wrap.style.display = "";
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function downloadRowPdf(id) {
        const item = fpls.find((f) => f.id === id);
        if (!item) return;
        const matched = backendCallSigns.find(
            (c) => c.call_sign && c.call_sign.toUpperCase() === (item.call_sign || "").toUpperCase()
        );
        const payload = {
            callSign: item.call_sign,
            from: item.departure_from,
            to: item.destination_to,
            departureTimeUtc: item.dep_time_utc,
            dateOfFlight: item.date_of_flight,
            pilotName: item.pilot_name,
            mobileNumber: item.mobile_number,
            coPilotName: item.co_pilot_name,
            cabinName: item.cabin_name,
            remarks: item.remarks,
            dpfz: item.dpfz_zzzz_place_name,
            dpfzLat: item.dpfz_zzzz_lat_long,
            drst: item.drst_zzzz_place_name,
            drstLat: item.drst_zzzz_lat_long,
            flightRule: matched ? matched.flight_rule : "I",
            flightType: matched ? matched.flight_type : "N",
            aircraftType: matched ? matched.aircraft_type : "C56X",
            wake: matched ? matched.weight_category : "M",
            equipment: matched ? matched.equipments : "SDFGHRWY/S",
        };
        generatePdfFromPayload(payload, true);
    }

    function fmtDate(iso) {
        if (!iso) return "03-Apr-2026";
        const d = new Date(iso);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}-${d.getFullYear()}`;
    }

    function pdfFilename(p) {
        return `FPL ${p.callSign || "VTCSP"} ${p.from || "VEBN"} ${p.departureTimeUtc || "1545"}-${p.to || "VABP"} ${fmtDate(p.dateOfFlight)}.pdf`;
    }

    function combBox(length, value, width = '14px', height = '18px') {
        const val = (value || '').toUpperCase();
        const chars = val.padEnd(length, ' ').slice(0, length).split('');
        let cells = '';
        chars.forEach((char, index) => {
            const borderRight = index < length - 1 ? 'border-right:1px solid black;' : '';
            cells += `<div style="width:${width};height:${height};${borderRight}display:flex;align-items:center;justify-content:center;font-weight:bold;font-family:monospace,sans-serif;font-size:11px;">${char.trim()}</div>`;
        });
        return `<div style="display:inline-flex;border:1px solid black;background-color:transparent;">${cells}</div>`;
    }

    function fieldLabel(text, extra = '') {
        return `<div style="font-size:7px;color:#111;${extra}">${text}</div>`;
    }

    const arrowSymbol = `<span style="font-size:13px;font-weight:bold;margin:0 4px;">&#10142;</span>`;
    const endSymbol = `<span style="font-size:14px;font-weight:bold;margin:0 4px;display:inline-flex;align-items:center;">&lt;&lt;&#8801;</span>`;

    function buildFplHtml(p, title) {
        const matched = backendCallSigns.find(
            (c) => c.call_sign && c.call_sign.toUpperCase() === (p.callSign || "").toUpperCase()
        ) || {};

        const rawDate = p.dateOfFlight || "";
        const dateStr = rawDate ? rawDate.replace(/-/g, '').slice(2) : "";
        const dateArr = rawDate ? rawDate.split('-') : ["", "", ""];
        const day = dateArr[2] || "";
        const depTime = (p.departureTimeUtc || "").padStart(4, "0");
        const hh = depTime.substring(0, 2);
        const mm = depTime.substring(2, 4);

        const routeRemarks = [];
        if (p.dpfz) routeRemarks.push(`DPFZ/${p.dpfz} ${p.dpfzLat || ''}`.trim());
        if (p.drst) routeRemarks.push(`DRST/${p.drst} ${p.drstLat || ''}`.trim());
        const navRmk = routeRemarks.length > 0 ? routeRemarks.join(' ') + ' ' : '';

        const addressesLine1 = "VEBNZTZX VEBNZPZX VABPZTZX VECFZQZX VECCZPZX VABFZQZX VABBYFYF VIDPZDZX";
        const callSignVal = (p.callSign || "").toUpperCase();
        const flightRuleVal = (p.flightRule || matched.flight_rule || "I").toUpperCase();
        const flightTypeVal = (p.flightType || matched.flight_type || "N").toUpperCase();
        const aircraftTypeVal = (p.aircraftType || matched.aircraft_type || "C56X").toUpperCase();
        const wakeVal = (p.wake || matched.weight_category || "M").toUpperCase();
        const equipVal = (p.equipment || matched.equipments || "SDFGHRWY/S").toUpperCase();
        const speedVal = (p.speed || matched.speed || "N0394").toUpperCase();
        const levelVal = (p.level || matched.level || "F360").toUpperCase();
        const routeVal = (p.route || matched.route || "BBN G590 BPL").toUpperCase();
        const remarksVal = (p.remarks || "TCAS EQUIPPED NO CREDIT FACILITY ALL INDIANS ON BOARD").toUpperCase();
        const pilotVal = (p.pilotName || "").toUpperCase();
        const mobileVal = p.mobileNumber || "";
        const coPilotVal = (p.coPilotName || "").toUpperCase();

        return `
        <div class="pdf-container" style="width:794px;height:1115px;background-color:#ffffff;color:#000000;font-family:Arial,sans-serif;font-size:10px;padding:36px;box-sizing:border-box;">
            <div style="border:4px solid black;display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
                <!-- Header: Flight Plan -->
                <div style="text-align:center;font-weight:bold;font-size:18px;border-bottom:2px solid black;padding:4px 0;">
                    Flight Plan
                </div>

                <!-- Priority & Addressee -->
                <div style="display:flex;border-bottom:1px solid black;">
                    <div style="width:20%;border-right:1px solid black;padding:2px 4px;">
                        ${fieldLabel("PRIORITY")}
                        <div style="display:flex;align-items:center;margin-top:4px;">
                            ${endSymbol} <span style="font-weight:bold;font-size:16px;margin:0 8px;">FF</span> ${arrowSymbol}
                        </div>
                    </div>
                    <div style="width:80%;padding:2px 4px;display:flex;flex-direction:column;justify-content:space-between;">
                        ${fieldLabel("ADDRESSEE(S)")}
                        <div style="font-weight:bold;font-family:monospace;font-size:13px;margin-top:2px;">
                            ${addressesLine1}
                        </div>
                        <div style="text-align:right;margin-top:-5px;">${endSymbol}</div>
                    </div>
                </div>

                <!-- Filing Time & Originator -->
                <div style="display:flex;border-bottom:1px solid black;">
                    <div style="width:30%;border-right:1px solid black;padding:2px 4px;">
                        ${fieldLabel("FILING TIME")}
                        <div style="display:flex;align-items:center;margin-top:2px;">
                            ${combBox(6, `${day}${hh}${mm}`)} ${arrowSymbol}
                        </div>
                    </div>
                    <div style="width:70%;padding:2px 4px;">
                        ${fieldLabel("ORIGINATOR")}
                        <div style="display:flex;align-items:center;margin-top:2px;">
                            ${combBox(8, "KINDXAAI")}
                        </div>
                    </div>
                </div>

                <div style="border-bottom:2px solid black;padding:2px 4px;">
                    ${fieldLabel("SPECIFIC IDENTIFICATION OF ADDRESSEE(S) AND / OR ORIGINATOR")}
                    <div style="height:14px;"></div>
                </div>

                <!-- SECTION 1 -->
                <div style="display:flex;border-bottom:1px solid black;">
                    <div style="width:25%;padding:2px 4px;">
                        ${fieldLabel("3 MESSAGE TYPE")}
                        <div style="display:flex;align-items:center;margin-top:4px;">
                            ${endSymbol} <span style="font-weight:bold;font-size:16px;margin-left:4px;">(FPL</span>
                        </div>
                    </div>
                    <div style="width:40%;padding:2px 4px;">
                        ${fieldLabel("7 AIRCRAFT IDENTIFICATION")}
                        <div style="display:flex;align-items:center;margin-top:2px;">
                            <span style="font-weight:bold;font-size:14px;margin-right:4px;">-</span>
                            ${combBox(7, callSignVal)}
                        </div>
                    </div>
                    <div style="width:20%;padding:2px 4px;">
                        ${fieldLabel("8 FLIGHT RULES")}
                        <div style="display:flex;align-items:center;margin-top:2px;">
                            <span style="font-weight:bold;font-size:14px;margin-right:4px;">-</span>
                            ${combBox(1, flightRuleVal)}
                        </div>
                    </div>
                    <div style="width:15%;padding:2px 4px;display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;">
                        <div style="width:100%;">
                            ${fieldLabel("TYPE OF FLIGHT", "text-align:center;")}
                            <div style="display:flex;justify-content:center;margin-top:2px;">
                                ${combBox(1, flightTypeVal)}
                            </div>
                        </div>
                        <div style="text-align:right;margin-top:-5px;">${endSymbol}</div>
                    </div>
                </div>

                <!-- SECTION 2 -->
                <div style="display:flex;border-bottom:1px solid black;">
                    <div style="width:15%;padding:2px 4px;">
                        ${fieldLabel("9 NUMBER")}
                        <div style="display:flex;align-items:center;margin-top:2px;">
                            <span style="font-weight:bold;font-size:14px;margin-right:4px;">-</span>
                            ${combBox(2, "01")}
                        </div>
                    </div>
                    <div style="width:20%;padding:2px 4px;">
                        ${fieldLabel("TYPE OF AIRCRAFT")}
                        <div style="display:flex;align-items:center;margin-top:2px;">
                            ${combBox(4, aircraftTypeVal)}
                        </div>
                    </div>
                    <div style="width:25%;padding:2px 4px;">
                        ${fieldLabel("WAKE TURBULENCE CAT.")}
                        <div style="display:flex;align-items:center;margin-top:2px;">
                            <span style="font-weight:bold;font-size:14px;margin:0 4px;">/</span>
                            ${combBox(1, wakeVal)} ${arrowSymbol}
                        </div>
                    </div>
                    <div style="width:40%;padding:2px 4px;display:flex;flex-direction:column;justify-content:space-between;">
                        <div>
                            ${fieldLabel("10 EQUIPMENT")}
                            <div style="display:flex;align-items:center;margin-top:2px;">
                                <div style="border:1px solid black;padding:2px 6px;font-weight:bold;font-size:13px;letter-spacing:2px;">
                                    ${equipVal}
                                </div>
                            </div>
                        </div>
                        <div style="text-align:right;margin-top:-5px;">${endSymbol}</div>
                    </div>
                </div>

                <!-- SECTION 3 -->
                <div style="display:flex;border-bottom:1px solid black;">
                    <div style="width:45%;padding:2px 4px;">
                        ${fieldLabel("13 DEPARTURE AERODROME")}
                        <div style="display:flex;align-items:center;margin-top:2px;">
                            <span style="font-weight:bold;font-size:14px;margin-right:4px;">-</span>
                            ${combBox(4, (p.from || "").toUpperCase())}
                        </div>
                    </div>
                    <div style="width:55%;padding:2px 4px;display:flex;justify-content:space-between;align-items:flex-end;">
                        <div>
                            ${fieldLabel("TIME")}
                            <div style="display:flex;align-items:center;margin-top:2px;">
                                ${combBox(4, depTime)}
                            </div>
                        </div>
                        <div>${endSymbol}</div>
                    </div>
                </div>

                <!-- SECTION 4 -->
                <div style="display:flex;border-bottom:2px solid black;">
                    <div style="width:20%;padding:2px 4px;">
                        ${fieldLabel("15 CRUISING SPEED")}
                        <div style="display:flex;align-items:center;margin-top:2px;">
                            <span style="font-weight:bold;font-size:14px;margin-right:4px;">-</span>
                            ${combBox(5, speedVal)}
                        </div>
                    </div>
                    <div style="width:20%;padding:2px 4px;">
                        ${fieldLabel("LEVEL")}
                        <div style="display:flex;align-items:center;margin-top:2px;">
                            ${combBox(4, levelVal)} ${arrowSymbol}
                        </div>
                    </div>
                    <div style="width:60%;padding:2px 4px;">
                        ${fieldLabel("ROUTE")}
                        <div style="font-weight:bold;font-size:13px;margin-top:4px;">
                            ${routeVal}
                        </div>
                    </div>
                </div>

                <!-- SECTION 5 -->
                <div style="display:flex;border-bottom:1px solid black;padding-bottom:10px;">
                    <div style="width:30%;padding:2px 4px;">
                        ${fieldLabel("16 DESTINATION AERODROME")}
                        <div style="display:flex;align-items:center;margin-top:2px;margin-left:30px;">
                            ${combBox(4, (p.to || "").toUpperCase())}
                        </div>
                    </div>
                    <div style="width:20%;padding:2px 4px;text-align:center;">
                        ${fieldLabel("TOTAL EET<br>HR&nbsp;&nbsp;&nbsp;&nbsp;MIN")}
                        <div style="display:flex;justify-content:center;align-items:center;margin-top:2px;">
                            ${combBox(4, "0105")}
                        </div>
                    </div>
                    <div style="width:25%;padding:2px 4px;text-align:center;">
                        ${fieldLabel("ALTN AERODROME")}
                        <div style="display:flex;justify-content:center;align-items:center;margin-top:2px;">
                            ${arrowSymbol} ${combBox(4, "VAID")}
                        </div>
                    </div>
                    <div style="width:25%;padding:2px 4px;text-align:center;display:flex;flex-direction:column;justify-content:space-between;">
                        <div>
                            ${fieldLabel("2ND ALTN AERODROME")}
                            <div style="display:flex;justify-content:center;align-items:center;margin-top:2px;">
                                ${arrowSymbol} ${combBox(4, "VAJB")}
                            </div>
                        </div>
                        <div style="text-align:right;margin-top:-5px;">${endSymbol}</div>
                    </div>
                </div>

                <!-- SECTION 6 (18 OTHER INFORMATION) -->
                <div style="border-bottom:2px solid black;padding:4px 6px;display:flex;flex:1;">
                    <div style="width:90%;">
                        ${fieldLabel("18 OTHER INFORMATION")}
                        <div style="font-weight:bold;font-size:11px;margin-top:4px;font-family:monospace;line-height:1.5;">
                            - PBN/A1B2B3B4C2C3D2D3 NAV/GPS DOF/${dateStr} REG/${callSignVal} EET/VABF0037 ${navRmk}OPR/NAV DURGA AVIATION PVT LTD
                            <br>
                            RMK/ ${remarksVal}
                        </div>
                    </div>
                </div>

                <!-- SECTION 6 Closure -->
                <div style="border-bottom:2px solid black;display:flex;justify-content:flex-end;padding:2px 4px;">
                    <span style="font-size:18px;font-weight:bold;">)${endSymbol}</span>
                </div>

                <!-- SECTION 7 (Supplementary) -->
                <div style="text-align:center;font-size:8px;padding:6px 0;border-bottom:1px solid black;">
                    SUPPLEMENTARY INFORMATION (NOT TO BE TRANSMITTED IN FPL MESSAGES)
                </div>

                <div style="border-bottom:1px solid black;padding:4px 0;">
                    <div style="display:flex;align-items:center;justify-content:center;">
                        <div style="width:20%;padding:0 4px;display:flex;align-items:center;">
                            <span style="font-weight:bold;font-size:14px;margin-right:4px;">- E /</span>
                            <div>
                                ${fieldLabel("19 ENDURANCE<br>HR&nbsp;&nbsp;&nbsp;&nbsp;MIN", "text-align:center;margin-bottom:2px;")}
                                ${combBox(4, "0230")}
                            </div>
                        </div>
                        <div style="width:40%;padding:0 4px;display:flex;align-items:center;justify-content:center;">
                            ${arrowSymbol} <span style="font-weight:bold;font-size:14px;margin-right:4px;">P /</span>
                            <div>
                                ${fieldLabel("PERSONS ON BOARD", "text-align:center;margin-bottom:2px;")}
                                ${combBox(3, "TBN")}
                            </div>
                        </div>
                        <div style="width:40%;padding:0 4px;display:flex;align-items:center;justify-content:center;">
                            ${arrowSymbol} <span style="font-weight:bold;font-size:14px;margin-right:4px;">R /</span>
                            <div>
                                ${fieldLabel("EMERGENCY RADIO", "text-align:center;margin-bottom:2px;")}
                                <div style="display:flex;gap:20px;">
                                    <div style="border:1px solid black;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-weight:bold;">U</div>
                                    <div style="border:1px solid black;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-weight:bold;">V</div>
                                    <div style="border:1px solid black;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-weight:bold;">
                                        <div style="position:relative;">
                                            E
                                            <div style="position:absolute;top:-2px;left:-2px;font-size:18px;">&#10005;</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECTION 8 (Survival) -->
                <div style="border-bottom:1px solid black;padding:4px 0;">
                    <div style="display:flex;align-items:center;">
                        <div style="width:45%;padding:0 4px;display:flex;align-items:center;">
                            ${arrowSymbol} <span style="font-weight:bold;font-size:14px;margin-right:4px;">S /</span>
                            <div>
                                ${fieldLabel("SURVIVAL EQUIPMENT", "text-align:left;margin-bottom:2px;margin-left:10px;")}
                                <div style="display:flex;gap:25px;margin-left:10px;">
                                    <div style="border:1px solid black;width:20px;height:20px;display:flex;align-items:center;justify-content:center;position:relative;">
                                        <span style="font-weight:bold;">P</span>
                                        <div style="position:absolute;top:0;left:2px;font-size:18px;">&#10005;</div>
                                    </div>
                                    <div style="border:1px solid black;width:20px;height:20px;display:flex;align-items:center;justify-content:center;position:relative;">
                                        <span style="font-weight:bold;">D</span>
                                        <div style="position:absolute;top:0;left:2px;font-size:18px;">&#10005;</div>
                                    </div>
                                    <div style="border:1px solid black;width:20px;height:20px;display:flex;align-items:center;justify-content:center;position:relative;">
                                        <span style="font-weight:bold;">M</span>
                                    </div>
                                    <div style="border:1px solid black;width:20px;height:20px;display:flex;align-items:center;justify-content:center;position:relative;">
                                        <span style="font-weight:bold;">J</span>
                                        <div style="position:absolute;top:0;left:2px;font-size:14px;">&#10005;</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style="width:55%;padding:0 4px;display:flex;align-items:center;">
                            ${arrowSymbol} <span style="font-weight:bold;font-size:14px;margin-right:4px;">J /</span>
                            <div>
                                ${fieldLabel("JACKETS", "text-align:left;margin-bottom:2px;margin-left:10px;")}
                                <div style="display:flex;gap:20px;margin-left:10px;">
                                    <div style="border:1px solid black;width:20px;height:20px;display:flex;align-items:center;justify-content:center;position:relative;">
                                        <span style="font-weight:bold;">L</span>
                                        <div style="position:absolute;top:0;left:2px;font-size:16px;">&#10005;</div>
                                    </div>
                                    <div style="border:1px solid black;width:20px;height:20px;display:flex;align-items:center;justify-content:center;position:relative;">
                                        <span style="font-weight:bold;">F</span>
                                        <div style="position:absolute;top:0;left:2px;font-size:16px;">&#10005;</div>
                                    </div>
                                    <div style="border:1px solid black;width:20px;height:20px;display:flex;align-items:center;justify-content:center;position:relative;">
                                        <span style="font-weight:bold;">U</span>
                                        <div style="position:absolute;top:0;left:2px;font-size:16px;">&#10005;</div>
                                    </div>
                                    <div style="border:1px solid black;width:20px;height:20px;display:flex;align-items:center;justify-content:center;position:relative;">
                                        <span style="font-weight:bold;">V</span>
                                        <div style="position:absolute;top:0;left:2px;font-size:16px;">&#10005;</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECTION 9 (Dinghies) -->
                <div style="border-bottom:1px solid black;padding:4px 0;">
                    <div style="display:flex;align-items:center;">
                        <div style="width:100%;padding:0 4px;display:flex;align-items:center;">
                            ${arrowSymbol} <span style="font-weight:bold;font-size:14px;margin-right:4px;">D /</span>
                            <div style="display:flex;align-items:flex-end;margin-left:10px;">
                                <div style="margin-right:10px;">
                                    ${fieldLabel("DINGHIES<br>NUMBER", "text-align:center;margin-bottom:2px;")}
                                    ${combBox(2, "")}
                                </div>
                                <div style="margin-right:10px;">
                                    ${fieldLabel("CAPACITY", "text-align:center;margin-bottom:2px;")}
                                    ${combBox(3, "")} ${arrowSymbol}
                                </div>
                                <div style="margin-right:10px;">
                                    <div style="border:1px solid black;width:20px;height:20px;display:flex;align-items:center;justify-content:center;position:relative;">
                                        <span style="font-weight:bold;">C</span>
                                        <div style="position:absolute;top:0;left:2px;font-size:18px;">&#10005;</div>
                                    </div>
                                </div>
                                <div style="flex:1;padding-left:10px;">
                                    ${fieldLabel("COLOUR", "text-align:left;margin-bottom:2px;")}
                                    <div style="border:1px solid black;height:22px;width:150px;"></div>
                                </div>
                            </div>
                            <div style="flex:1;text-align:right;">${endSymbol}</div>
                        </div>
                    </div>
                </div>

                <!-- SECTION 10 (A/ Colour) -->
                <div style="border-bottom:1px solid black;padding:8px 4px;display:flex;align-items:center;">
                    <div style="font-weight:bold;font-size:14px;width:40px;">A /</div>
                    <div style="font-weight:bold;font-size:12px;font-family:monospace;">WHITE WITH RED AND GOLDEN STRIPS</div>
                </div>

                <!-- SECTION 11 (N/ Remarks) -->
                <div style="border-bottom:1px solid black;padding:4px 0;">
                    <div style="display:flex;align-items:center;">
                        <div style="width:100%;padding:0 4px;display:flex;align-items:flex-start;">
                            ${arrowSymbol}
                            <div style="border:1px solid black;width:20px;height:20px;display:flex;align-items:center;justify-content:center;position:relative;margin-right:10px;">
                                <span style="font-weight:bold;">N</span>
                                <div style="position:absolute;top:0;left:2px;font-size:18px;">&#10005;</div>
                            </div>
                            <div style="font-weight:bold;font-size:14px;margin-right:8px;margin-top:2px;">/</div>
                            <div style="flex:1;">
                                ${fieldLabel("REMARKS", "text-align:left;margin-bottom:2px;")}
                                <div style="border:1px solid black;height:22px;width:100%;max-width:500px;"></div>
                            </div>
                            <div style="text-align:right;margin-top:10px;">${endSymbol}</div>
                        </div>
                    </div>
                </div>

                <!-- SECTION 12 (C/ Pilot) -->
                <div style="padding:4px 0;border-bottom:2px solid black;">
                    <div style="display:flex;align-items:center;">
                        <div style="width:100%;padding:0 4px;display:flex;align-items:flex-start;">
                            <div style="font-weight:bold;font-size:14px;width:30px;text-align:right;margin-right:10px;margin-top:2px;">C /</div>
                            <div style="flex:1;">
                                ${fieldLabel("PILOT-IN-COMMAND", "text-align:left;margin-bottom:2px;")}
                                <div style="font-weight:bold;font-size:12px;font-family:monospace;padding-top:4px;">
                                    ${pilotVal} MOB ${mobileVal} ${coPilotVal ? 'CO-PILOT ' + coPilotVal : ''}
                                </div>
                            </div>
                            <div style="text-align:right;margin-top:10px;"><span style="font-size:18px;font-weight:bold;">) ${endSymbol}</span></div>
                        </div>
                    </div>
                </div>

                <!-- SECTION 13 (Briefing) -->
                <div style="width:100%;">
                    <table style="width:100%;border-collapse:collapse;font-size:10px;">
                        <tbody>
                            <tr style="border-bottom:1px solid black;">
                                <td style="border-right:1px solid black;padding:4px;vertical-align:top;width:35%;">
                                    1. COMMUNICATION BRIEFING<br>TIME:
                                </td>
                                <td style="border-right:1px solid black;padding:4px;vertical-align:top;width:30%;text-align:center;">
                                    <div style="font-style:italic;font-size:11px;color:#555;margin-bottom:4px;">Self Briefing</div>
                                    <div style="display:flex;justify-content:center;gap:4px;">DATE: <span style="font-weight:bold;font-size:11px;">${dateStr}</span></div>
                                </td>
                                <td style="padding:4px;vertical-align:bottom;width:35%;text-align:center;">
                                    <div style="border-bottom:1px solid black;display:inline-block;width:80%;margin-bottom:2px;"></div>
                                    <div>DUTY COMN. OFFICER</div>
                                </td>
                            </tr>
                            <tr style="border-bottom:1px solid black;">
                                <td style="border-right:1px solid black;padding:4px;vertical-align:top;">
                                    2. METEOROLOGICAL BRIEFING<br>TIME:
                                </td>
                                <td style="border-right:1px solid black;padding:4px;vertical-align:top;text-align:center;">
                                    <div style="font-style:italic;font-size:11px;color:#555;margin-bottom:4px;">Self Briefing</div>
                                    <div style="display:flex;justify-content:center;gap:4px;">DATE: <span style="font-weight:bold;font-size:11px;">${dateStr}</span></div>
                                </td>
                                <td style="padding:4px;vertical-align:bottom;text-align:center;">
                                    <div style="border-bottom:1px solid black;display:inline-block;width:80%;margin-bottom:2px;"></div>
                                    <div>DUTY MET. OFFICER</div>
                                </td>
                            </tr>
                            <tr>
                                <td style="border-right:1px solid black;padding:4px;vertical-align:top;">
                                    3. AIR TRAFFIC BRIEFING<br>TIME:
                                </td>
                                <td style="border-right:1px solid black;padding:0;vertical-align:top;">
                                    <div style="padding:2px;border-bottom:1px solid black;text-align:center;">
                                        <div style="display:flex;justify-content:center;gap:4px;margin-top:4px;margin-bottom:2px;">DATE: <span style="font-weight:bold;font-size:11px;">${dateStr}</span></div>
                                    </div>
                                    <div style="display:flex;height:18px;">
                                        <div style="width:50%;border-right:1px solid black;text-align:center;display:flex;align-items:center;justify-content:center;font-weight:bold;">FIC</div>
                                        <div style="width:50%;text-align:center;display:flex;align-items:center;justify-content:center;font-weight:bold;">ADC</div>
                                    </div>
                                </td>
                                <td style="padding:4px;vertical-align:bottom;text-align:center;">
                                    <div style="border-bottom:1px solid black;display:inline-block;width:80%;margin-bottom:2px;"></div>
                                    <div>DUTY ATC OFFICER</div>
                                    <div style="margin-top:2px;font-style:italic;font-size:8px;color:#333;">Signature of PIC or Designated Representative</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>`;
    }

    function generatePdfFromPayload(p, fromRow = false) {
        const target = document.getElementById(fromRow ? "fplPdfTableTarget" : "fplPdfTarget");
        target.innerHTML = buildFplHtml(p, fromRow ? "FPL COPY" : "NEW FPL");
        const filename = pdfFilename(p);
        const opt = {
            margin: 0,
            filename,
            image: { type: "jpeg", quality: 1.0 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        };
        try {
            html2pdf().set(opt).from(target).save();
        } catch (err) {
            console.error("PDF generation failed:", err);
            alert("PDF generation failed. See console for details.");
        }
    }

    return {
        init, toggleForm, resetForm, autofill, saveAndPdf, load,
        renderTable, applyFilters, clearFilters, editAndPdf, downloadRowPdf,
    };
})();
