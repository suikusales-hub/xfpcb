(function () {
    const toggleBtn = document.querySelector(".menu-toggle");
    const nav = document.querySelector("#primary-nav");

    if (toggleBtn && nav) {
        toggleBtn.addEventListener("click", function () {
            const isOpen = nav.classList.toggle("active");
            toggleBtn.setAttribute("aria-expanded", String(isOpen));
        });
    }

    document.querySelectorAll(".has-dropdown").forEach(function (dropdown) {
        const trigger = dropdown.querySelector(".dropdown-trigger");
        if (!trigger) return;

        trigger.setAttribute("aria-haspopup", "true");
        trigger.setAttribute("aria-expanded", "false");

        const openMenu = function () {
            dropdown.classList.add("is-open");
            trigger.setAttribute("aria-expanded", "true");
        };

        const closeMenu = function () {
            dropdown.classList.remove("is-open");
            trigger.setAttribute("aria-expanded", "false");
        };

        dropdown.addEventListener("mouseenter", openMenu);
        dropdown.addEventListener("mouseleave", closeMenu);
        dropdown.addEventListener("focusin", openMenu);
        dropdown.addEventListener("focusout", function (event) {
            if (!dropdown.contains(event.relatedTarget)) {
                closeMenu();
            }
        });

        trigger.addEventListener("click", function (event) {
            if (window.matchMedia("(max-width: 992px)").matches) {
                event.preventDefault();
                if (dropdown.classList.contains("is-open")) {
                    closeMenu();
                } else {
                    openMenu();
                }
            }
        });
    });

    const drawer = document.querySelector("#floatingDrawer");
    const openBtn = document.querySelector("#toggleFormBtn");
    const closeBtn = document.querySelector("#closeFormBtn");

    if (drawer && openBtn) {
        openBtn.addEventListener("click", function () {
            const isOpen = drawer.classList.toggle("is-open");
            openBtn.setAttribute("aria-expanded", String(isOpen));
        });
    }

    if (drawer && openBtn && closeBtn) {
        closeBtn.addEventListener("click", function () {
            drawer.classList.remove("is-open");
            openBtn.setAttribute("aria-expanded", "false");
        });
    }

    document.querySelectorAll("[data-current-url='true']").forEach(function (input) {
        input.value = window.location.href;
    });

    document.querySelectorAll("[data-referrer-url='true']").forEach(function (input) {
        input.value = document.referrer || "";
    });

    const params = new URLSearchParams(window.location.search);
    document.querySelectorAll("[data-utm]").forEach(function (input) {
        input.value = params.get(input.dataset.utm) || "";
    });
})();
