(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js-enabled");

  // 1. Theme Toggle (Midnight Dark <-> Minimal Paper Light)
  var themeToggle = document.getElementById("theme-toggle");
  var themeIconSun = document.getElementById("icon-sun");
  var themeIconMoon = document.getElementById("icon-moon");

  function syncThemeUI(theme) {
    var isLight = theme === "light";
    root.setAttribute("data-theme", theme);
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(isLight));
      themeToggle.setAttribute(
        "aria-label",
        isLight ? "Switch to Midnight dark theme" : "Switch to Minimal light theme"
      );
      themeToggle.setAttribute(
        "title",
        isLight ? "Switch to dark theme" : "Switch to light theme"
      );
    }
    if (themeIconSun && themeIconMoon) {
      themeIconSun.style.display = isLight ? "none" : "block";
      themeIconMoon.style.display = isLight ? "block" : "none";
    }
  }

  var savedTheme = null;
  try {
    savedTheme = localStorage.getItem("noel_resume_theme");
  } catch (e) {
    savedTheme = null;
  }
  syncThemeUI(savedTheme === "light" ? "light" : "dark");

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var nextTheme = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      syncThemeUI(nextTheme);
      try {
        localStorage.setItem("noel_resume_theme", nextTheme);
      } catch (e) {
        // Ignore storage errors in restricted contexts
      }
    });
  }

  // 2. Print / Save PDF
  var printButtons = document.querySelectorAll("[data-print-resume]");
  printButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      window.print();
    });
  });

  // 3. Copy Email with Live Status Feedback
  var copyButtons = document.querySelectorAll("[data-copy-email]");
  var liveStatus = document.getElementById("copy-status-live");
  var EMAIL_ADDRESS = "noeljedayala@gmail.com";

  function fallbackCopy(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(textarea);
    return ok;
  }

  function showCopiedState(btn) {
    var label = btn.querySelector("[data-copy-label]");
    if (!label) return;
    if (!btn.dataset.defaultLabel) {
      btn.dataset.defaultLabel = label.textContent;
    }
    label.textContent = "Email Copied";
    if (liveStatus) {
      liveStatus.textContent = "Email address copied to clipboard: " + EMAIL_ADDRESS;
    }
    window.clearTimeout(btn._copyTimer);
    btn._copyTimer = window.setTimeout(function () {
      label.textContent = btn.dataset.defaultLabel;
    }, 2200);
  }

  copyButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(EMAIL_ADDRESS).then(
          function () {
            showCopiedState(btn);
          },
          function () {
            if (fallbackCopy(EMAIL_ADDRESS)) showCopiedState(btn);
          }
        );
      } else if (fallbackCopy(EMAIL_ADDRESS)) {
        showCopiedState(btn);
      }
    });
  });

  // 4. Mobile Navigation Drawer
  var menuBtn = document.getElementById("mobile-menu-btn");
  var mobileDrawer = document.getElementById("mobile-drawer");

  function setDrawerOpen(open) {
    if (!menuBtn || !mobileDrawer) return;
    menuBtn.setAttribute("aria-expanded", String(open));
    mobileDrawer.classList.toggle("is-open", open);
    mobileDrawer.hidden = !open;
  }

  if (menuBtn && mobileDrawer) {
    menuBtn.addEventListener("click", function () {
      var isOpen = menuBtn.getAttribute("aria-expanded") === "true";
      setDrawerOpen(!isOpen);
    });

    mobileDrawer.querySelectorAll("a, button").forEach(function (item) {
      item.addEventListener("click", function () {
        setDrawerOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") {
        setDrawerOpen(false);
        menuBtn.focus();
      }
    });
  }

  // 5. Scroll Spy & Subtle Entrance Reveal
  var sections = document.querySelectorAll("main section[id]");
  var navAnchors = document.querySelectorAll(".nav-link, .mobile-drawer-link");

  function setActiveNav(id) {
    navAnchors.forEach(function (anchor) {
      var href = anchor.getAttribute("href");
      anchor.classList.toggle("is-active", href === "#" + id);
    });
  }

  if ("IntersectionObserver" in window) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveNav(entry.target.id);
          }
        });
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach(function (section) {
      navObserver.observe(section);
    });

    var revealTargets = document.querySelectorAll("[data-reveal]");
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.05 }
    );
    revealTargets.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // 6. Contact Form AJAX Submission (FormSubmit -> noeljedayala@gmail.com)
  var contactForm = document.getElementById("contact-form");
  var formStatus = document.getElementById("contact-form-status");
  var submitBtn = document.getElementById("contact-submit-btn");

  if (contactForm && formStatus && submitBtn) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var honey = contactForm.querySelector('input[name="_honey"]');
      if (honey && honey.value) return;

      var defaultBtnText = submitBtn.dataset.defaultText || submitBtn.textContent.trim();
      submitBtn.dataset.defaultText = defaultBtnText;
      submitBtn.disabled = true;
      submitBtn.setAttribute("aria-disabled", "true");
      submitBtn.textContent = "Sending...";

      formStatus.hidden = true;
      formStatus.className = "form-status";

      var formData = new FormData(contactForm);
      var payload = {};
      formData.forEach(function (value, key) {
        if (key !== "_honey") payload[key] = value;
      });

      fetch("https://formsubmit.co/ajax/noeljedayala@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { ok: response.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data && (result.data.success === true || result.data.success === "true")) {
            formStatus.textContent =
              "Message sent! Thank you for reaching out — Noel will reply shortly.";
            formStatus.classList.add("is-success");
            formStatus.hidden = false;
            contactForm.reset();
          } else {
            var serverMsg =
              result.data && result.data.message
                ? result.data.message
                : "Could not send directly right now. Please email noeljedayala@gmail.com directly.";
            throw new Error(serverMsg);
          }
        })
        .catch(function (err) {
          formStatus.textContent =
            err && err.message && err.message !== "Failed to fetch"
              ? err.message
              : "Could not send directly right now. Please email noeljedayala@gmail.com directly.";
          formStatus.classList.add("is-error");
          formStatus.hidden = false;
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.removeAttribute("aria-disabled");
          submitBtn.textContent = defaultBtnText;
        });
    });
  }
})();
