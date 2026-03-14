/* =========================
   Las Ninfas - JS
   - Hamburger accesible (<=900px)
   - Dropdown menú
   - Slider auto-rotación
   - Fallback si faltan imágenes
   ========================= */

(function () {
  // ===== Helpers
  const qs = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  // ===== Mobile menu
  const hamburger = qs(".hamburger");
  const panel = qs(".nav__panel[data-collapsible]");
  const navLinks = qsa(".nav__menu a");

  if (hamburger && panel) {
    const setOpen = (open) => {
      panel.classList.toggle("is-open", open);
      hamburger.setAttribute("aria-expanded", String(open));
      hamburger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    };

    hamburger.addEventListener("click", () => {
      const isOpen = hamburger.getAttribute("aria-expanded") === "true";
      setOpen(!isOpen);
    });

    // Cierra al hacer click en un link
    navLinks.forEach((a) => {
      a.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 900px)").matches) setOpen(false);
      });
    });

    // Cierra con Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    // Si crece viewport, asegúrate de no dejarlo abierto fijo
    window.addEventListener("resize", () => {
      if (!window.matchMedia("(max-width: 900px)").matches) setOpen(false);
    });
  }

  // ===== Dropdown (Menú)
  const dropdown = qs(".dropdown");
  if (dropdown) {
    const btn = qs(".dropdown__btn", dropdown);

    const closeDropdown = () => {
      dropdown.classList.remove("is-open");
      btn?.setAttribute("aria-expanded", "false");
    };

    btn?.addEventListener("click", (e) => {
      e.preventDefault();
      const isOpen = dropdown.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(isOpen));
    });

    // Click fuera cierra
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) closeDropdown();
    });

    // Escape cierra
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDropdown();
    });
  }

  // ===== Scroll top en footer logo
  qsa("[data-scrolltop]").forEach((btn) => {
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  });

  // ===== Image fallback placeholder (si no existen las fotos)
  const applyImgFallback = (img) => {
    const parent = img.parentElement;
    if (!parent) return;

    img.style.display = "none";
    const ph = document.createElement("div");
    ph.className = "img-placeholder";
    ph.textContent = "Coloca aquí tu imagen\n(/img/...)";
    parent.appendChild(ph);
  };

  qsa("img[data-fallback='true']").forEach((img) => {
    img.addEventListener("error", () => applyImgFallback(img), { once: true });
  });

  // ===== Slider
  const slider = qs("[data-slider]");
  if (slider) {
    const track = qs("[data-track]", slider);
    const slides = qsa(".slide", slider);
    const prevBtn = qs("[data-prev]", slider);
    const nextBtn = qs("[data-next]", slider);
    const dotsWrap = qs("[data-dots]", slider);
    const dots = dotsWrap ? qsa(".dot", dotsWrap) : [];

    let index = 0;
    let timer = null;
    const AUTOPLAY_MS = 4500;

    const update = () => {
      if (!track) return;
      track.style.transform = `translateX(${-index * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    };

    const go = (i) => {
      index = (i + slides.length) % slides.length;
      update();
    };

    const next = () => go(index + 1);
    const prev = () => go(index - 1);

    nextBtn?.addEventListener("click", () => {
      next();
      restart();
    });

    prevBtn?.addEventListener("click", () => {
      prev();
      restart();
    });

    dots.forEach((d) => {
      d.addEventListener("click", () => {
        const i = Number(d.getAttribute("data-dot"));
        if (!Number.isNaN(i)) go(i);
        restart();
      });
    });

    // Swipe simple (mobile)
    let startX = 0;
    const viewport = qs("[data-viewport]", slider);
    viewport?.addEventListener("pointerdown", (e) => {
      startX = e.clientX;
    });
    viewport?.addEventListener("pointerup", (e) => {
      const dx = e.clientX - startX;
      if (Math.abs(dx) < 30) return;
      dx < 0 ? next() : prev();
      restart();
    });

    const start = () => {
      stop();
      timer = window.setInterval(next, AUTOPLAY_MS);
    };
    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };
    const restart = () => {
      start();
    };

    // Pausa al hover/focus
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    slider.addEventListener("focusin", stop);
    slider.addEventListener("focusout", start);

    update();
    start();
  }

    // ===== Lightbox para gallery strip (click/touch)
  const openLightbox = (src, alt = "") => {
    // evita abrir más de uno
    if (document.querySelector(".lightbox")) return;

    const overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Vista ampliada de imagen");

    const img = document.createElement("img");
    img.className = "lightbox__img";
    img.src = src;
    img.alt = alt || "Imagen ampliada";

    const hint = document.createElement("div");
    hint.className = "lightbox__hint";
    hint.textContent = "Toca o haz click fuera para cerrar • ESC";

    overlay.appendChild(img);
    overlay.appendChild(hint);

    const close = () => {
      overlay.remove();
      document.body.classList.remove("is-lock-scroll");
      document.removeEventListener("keydown", onKey);
    };

    const onKey = (e) => {
      if (e.key === "Escape") close();
    };

    // Click fuera de la imagen cierra
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener("keydown", onKey);
    document.body.classList.add("is-lock-scroll");
    document.body.appendChild(overlay);
  };

  // Delegación: sirve aunque cambies las imágenes luego
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".strip__item img");
    if (!img) return;

    // Si tu fallback ocultó la img y metió placeholder, aquí ni entra
    // (pero por si acaso, evita abrir si está oculto)
    const isHidden = getComputedStyle(img).display === "none";
    if (isHidden) return;

    openLightbox(img.currentSrc || img.src, img.alt || "");
  });
  
})();