/*============================================================================
  FLIGHT CADENCE — Global UI behaviour
  Theme toggle (instant, persistent, no-flicker), UTC/IST live clocks,
  mobile drawers, app shell sidebar, tools dropdown, user menu,
  and time converter modal.
============================================================================*/

const APP = (() => {
    // ---------- Theme ----------
    const THEME_KEY = "fc_theme";
    const html = document.documentElement;

    function getTheme() {
        try {
            const stored = localStorage.getItem(THEME_KEY);
            if (stored === "light" || stored === "dark") return stored;
        } catch (e) {}
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
            return "light";
        }
        return "dark";
    }

    function setTheme(t) {
        html.setAttribute("data-theme", t);
        try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
        updateThemeIcons();
    }

    function toggleTheme() {
        const current = html.getAttribute("data-theme") || getTheme();
        const newTheme = current === "dark" ? "light" : "dark";
        setTheme(newTheme);
    }

    function updateThemeIcons() {
        const isDark = (html.getAttribute("data-theme") || getTheme()) === "dark";
        document.querySelectorAll(".theme-toggle").forEach((el) => {
            el.setAttribute("data-theme", isDark ? "dark" : "light");
            el.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
            el.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");
        });
    }

    // ---------- Clocks ----------
    function updateClocks() {
        const now = new Date();
        const fmt = (tz) => now.toLocaleTimeString("en-GB", {
            timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
        });
        const utcStr = fmt("UTC");
        const istStr = fmt("Asia/Kolkata");

        ["utcTime", "utcTimeD"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.textContent = utcStr;
        });
        ["istTime", "istTimeD"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.textContent = istStr;
        });
    }

    // ---------- Public mobile drawer ----------
    function initPublicDrawer() {
        const btn = document.getElementById("mobileMenuBtn");
        const drawer = document.getElementById("mobileDrawer");
        const closeBtn = document.getElementById("closeDrawer");
        if (!btn || !drawer) return;

        btn.addEventListener("click", () => drawer.classList.add("open"));
        if (closeBtn) closeBtn.addEventListener("click", () => drawer.classList.remove("open"));
        drawer.addEventListener("click", (e) => {
            if (e.target === drawer) drawer.classList.remove("open");
        });
    }

    // ---------- Public header scroll effect ----------
    function initHeaderScroll() {
        const header = document.getElementById("publicHeader");
        if (!header) return;
        const handleScroll = () => {
            if (window.scrollY > 20) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
    }

    // ---------- App shell (Sidebar, Tools Dropdown, Overlay) ----------
    function initAppShell() {
        const toggle = document.getElementById("toggleSidebar");
        const sidebar = document.getElementById("appSidebar");
        const overlay = document.getElementById("sidebarOverlay");
        const closeBtn = document.getElementById("closeSidebar");

        function openSidebar() {
            if (sidebar) sidebar.classList.add("open");
            if (overlay) overlay.classList.add("open");
        }

        function closeSidebar() {
            if (sidebar) sidebar.classList.remove("open");
            if (overlay) overlay.classList.remove("open");
        }

        if (toggle) {
            toggle.addEventListener("click", (e) => {
                e.stopPropagation();
                if (sidebar && sidebar.classList.contains("open")) {
                    closeSidebar();
                } else {
                    openSidebar();
                }
            });
        }
        if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
        if (overlay) overlay.addEventListener("click", closeSidebar);

        // Auto-close sidebar on mobile navigation click
        if (sidebar) {
            sidebar.querySelectorAll(".nav-link:not(.nav-dropdown-trigger), .dropdown-item").forEach((link) => {
                link.addEventListener("click", () => {
                    if (window.innerWidth <= 1024) {
                        closeSidebar();
                    }
                });
            });
        }

        // Tools Dropdown
        const toolsTrigger = document.getElementById("toolsTrigger");
        const toolsMenu = document.getElementById("toolsMenu");
        if (toolsTrigger && toolsMenu) {
            toolsTrigger.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                toolsMenu.classList.toggle("open");
                toolsTrigger.classList.toggle("open");
            });

            // If currently on pdf-edit or pdf-merge, keep dropdown open by default
            if (window.location.pathname.includes("pdf-edit") || window.location.pathname.includes("pdf-merge")) {
                toolsMenu.classList.add("open");
                toolsTrigger.classList.add("open");
            }
        }

        // Resize handler
        window.addEventListener("resize", () => {
            if (window.innerWidth > 1024) {
                closeSidebar();
            }
        });
    }

    // ---------- User dropdown ----------
    function initUserMenu() {
        const trigger = document.getElementById("userTrigger");
        const dropdown = document.getElementById("userDropdown");
        if (!trigger || !dropdown) return;

        trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("open");
        });

        document.addEventListener("click", (e) => {
            if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove("open");
            }
        });
    }

    // ---------- Time converter ----------
    function initTimeConverter() {
        const btn = document.getElementById("timeConverterBtn");
        const modal = document.getElementById("timeConverterModal");
        const closeBtn = document.getElementById("closeConverterBtn");
        const backdrop = document.getElementById("closeConverter");
        const utcIn = document.getElementById("utcInput");
        const istIn = document.getElementById("istInput");
        if (!btn || !modal) return;

        function openModal() { modal.classList.add("open"); }
        function closeModal() { modal.classList.remove("open"); }

        btn.addEventListener("click", openModal);
        if (closeBtn) closeBtn.addEventListener("click", closeModal);
        if (backdrop) backdrop.addEventListener("click", closeModal);

        function pad(n) { return String(n).padStart(2, "0"); }
        function toMinutes(hhmm) {
            const [h, m] = hhmm.split(":").map(Number);
            return (h || 0) * 60 + (m || 0);
        }
        function fmtMins(total) {
            let t = ((total % 1440) + 1440) % 1440;
            return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
        }
        function convertUtc() {
            const v = utcIn.value.replace(/\D/g, "");
            if (v.length < 4) { if (istIn) istIn.value = ""; return; }
            const hh = v.slice(0, 2); const mm = v.slice(2, 4);
            const h = Math.min(23, Math.max(0, parseInt(hh, 10)));
            const m = Math.min(59, Math.max(0, parseInt(mm, 10)));
            utcIn.value = `${pad(h)}:${pad(m)}`;
            if (istIn) istIn.value = fmtMins(toMinutes(`${pad(h)}:${pad(m)}`) + 330);
        }
        function convertIst() {
            const v = istIn.value.replace(/\D/g, "");
            if (v.length < 4) { if (utcIn) utcIn.value = ""; return; }
            const hh = v.slice(0, 2); const mm = v.slice(2, 4);
            const h = Math.min(23, Math.max(0, parseInt(hh, 10)));
            const m = Math.min(59, Math.max(0, parseInt(mm, 10)));
            istIn.value = `${pad(h)}:${pad(m)}`;
            if (utcIn) utcIn.value = fmtMins(toMinutes(`${pad(h)}:${pad(m)}`) - 330);
        }
        if (utcIn) utcIn.addEventListener("input", convertUtc);
        if (istIn) istIn.addEventListener("input", convertIst);
    }

    // ---------- Logout ----------
    async function logout() {
        try {
            await fetch("/api/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") || "" },
                credentials: "same-origin",
            });
        } catch (e) { /* ignore */ }
        location.href = "/";
    }

    function getCookie(name) {
        const v = `; ${document.cookie}`;
        const parts = v.split(`; ${name}=`);
        return parts.length === 2 ? parts.pop().split(";").shift() : null;
    }

    // ---------- Init ----------
    function init() {
        setTheme(getTheme());
        setInterval(updateClocks, 1000);
        updateClocks();
        initPublicDrawer();
        initHeaderScroll();
        initAppShell();
        initUserMenu();
        initTimeConverter();

        // Single clean listener for theme toggles
        document.querySelectorAll(".theme-toggle").forEach((btn) => {
            btn.onclick = (e) => {
                e.preventDefault();
                toggleTheme();
            };
        });
    }

    return { init, logout, toggleTheme, getTheme, setTheme };
})();

document.addEventListener("DOMContentLoaded", () => APP.init());
