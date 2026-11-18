$(document).ready(function () {
  // Minimalist Back to Top Button
  const $backToTopBtn = $("#backToTopBtn");
  if ($backToTopBtn.length) {
    $(window).on("scroll", function () {
      if ($(this).scrollTop() > 320) {
        $backToTopBtn.addClass("is-visible");
      } else {
        $backToTopBtn.removeClass("is-visible");
      }
    });

    $backToTopBtn.on("click", function () {
      $("html, body").stop().animate({ scrollTop: 0 }, 450);
    });
  }
  const heroImgContainer = $(".hero-img-container");
  const heroImgFrame = $(".hero-img-frame");
  let isShuffling = false;

  let clickCount = 0;
  let phase = 1;
  let pauseTimer = null;
  let resetTimer = null;

  const squad404Quotes = [
    {
      text: '"Those who don\'t exist have no need for names. Just get the job done."',
      sender: "— UMP45 // SQUAD 404",
    },
    {
      text: '"We are the shadows that survive where others fall. Keep moving forward, Commander."',
      sender: "— UMP45 // SECTOR 09",
    },
    {
      text: '"Kazoku? Yeah, 404 is all the family I need. Now, what\'s our next target?"',
      sender: "— UMP45 // ENCRYPTED CHANNEL",
    },
  ];

  function triggerSquad404EasterEgg() {
    const pick =
      squad404Quotes[Math.floor(Math.random() * squad404Quotes.length)];
    $("#squad404Quote").text(pick.text);
    $("#squad404Sender").text(pick.sender);
    $("#squad404Modal").addClass("is-shown");
  }

  function closeSquad404Modal() {
    $("#squad404Modal").removeClass("is-shown");
  }

  $("#close404Modal").on("click", closeSquad404Modal);

  // Tutup modal jika klik area gelap di luar kotak dialog
  $("#squad404Modal").on("click", function (e) {
    if (e.target === this) {
      closeSquad404Modal();
    }
  });

  // Tutup modal dengan tombol Escape
  $(document).on("keydown", function (e) {
    if (e.key === "Escape" && $("#squad404Modal").hasClass("is-shown")) {
      closeSquad404Modal();
    }
  });

  $("#close404Toast").on("click", function () {
    $("#squad404Toast").removeClass("is-shown");
  });

  function reset45Sequence() {
    clickCount = 0;
    phase = 1;
    clearTimeout(pauseTimer);
    clearTimeout(resetTimer);
    heroImgFrame.css({
      "border-color": "",
      opacity: "",
      "box-shadow": "",
    });
  }

  function register45Pattern() {
    clearTimeout(pauseTimer);
    clearTimeout(resetTimer);

    clickCount++;

    if (phase === 1) {
      if (clickCount === 4) {
        // Tunggu user berhenti sejenak (900ms) untuk mengunci angka "4"
        pauseTimer = setTimeout(() => {
          phase = 2;
          clickCount = 0;
          // Nyalakan bingkai amber sebagai tanda Fase 1 ("4") terkunci
          heroImgFrame.css({
            "border-color": "var(--eye-amber)",
            opacity: "0.95",
            "box-shadow": "0 0 18px rgba(212, 118, 51, 0.35)",
          });
          // Beri waktu 4.5 detik untuk mulai klik Fase 2 ("5")
          resetTimer = setTimeout(reset45Sequence, 4500);
        }, 900);
      } else if (clickCount > 4) {
        // Kalau kebablasan klik ke-5 tanpa jeda, mulai hitung ulang dari 1
        clickCount = 1;
      }

      // Batas santai antar-klik di Fase 1 (1.2 detik)
      if (clickCount < 4) {
        resetTimer = setTimeout(reset45Sequence, 1200);
      }
    } else if (phase === 2) {
      if (clickCount === 5) {
        reset45Sequence();
        triggerSquad404EasterEgg();
        return;
      }
      // Batas santai antar-klik di Fase 2 (1.2 detik)
      resetTimer = setTimeout(reset45Sequence, 1200);
    }
  }

  function triggerShuffle($container) {
    if (isShuffling) return;
    isShuffling = true;
    $("#shuffleHint").addClass("is-hidden");

    const isSwapped = $container.hasClass("is-swapped");
    const $frontImg = isSwapped
      ? $container.find(".hero-img-hover")
      : $container.find(".hero-img-original");
    const $backImg = isSwapped
      ? $container.find(".hero-img-original")
      : $container.find(".hero-img-hover");

    $frontImg.removeClass("card-front card-back");
    $backImg.removeClass("card-front card-back");

    $frontImg.addClass("card-front");
    $backImg.addClass("card-back");
    $container.addClass("shuffling");

    setTimeout(() => {
      isShuffling = false;
    }, 120);

    setTimeout(() => {
      $container.toggleClass("is-swapped");
      $container.removeClass("shuffling");
      $frontImg.removeClass("card-front");
      $backImg.removeClass("card-back");
    }, 520);
  }

  heroImgContainer.on("click", function () {
    register45Pattern();
    triggerShuffle($(this));
  });
  const navLinks = $(".navbar-nav .nav-link");
  const navbar = $(".navbar");
  const scrollProgress = $("#scrollProgress");

  // Scroll Spy, Navbar State & Top Progress Bar
  function handleScroll() {
    const scrollPos = $(document).scrollTop();
    const windowHeight = $(window).height();
    const docHeight = $(document).height();
    const offset = 150;

    // Update thin scroll progress indicator
    const scrollableHeight = docHeight - windowHeight;
    if (scrollableHeight > 0 && scrollProgress.length) {
      const progress = Math.min((scrollPos / scrollableHeight) * 100, 100);
      scrollProgress.css("width", progress + "%");
    }

    // Active section highlight
    if (scrollPos + windowHeight >= docHeight - 50) {
      navLinks.removeClass("active");
      $('.nav-link[href="#contact"]').addClass("active");
    } else {
      navLinks.each(function () {
        const currLink = $(this);
        const targetId = currLink.attr("href");

        if (targetId && targetId.startsWith("#") && targetId.length > 1) {
          const refElement = $(targetId);
          if (refElement.length) {
            const elementTop = refElement.position().top;
            if (
              elementTop <= scrollPos + offset &&
              elementTop + refElement.outerHeight() > scrollPos + offset
            ) {
              navLinks.removeClass("active");
              currLink.addClass("active");
            }
          }
        }
      });
    }

    // Navbar scrolled styling
    if (scrollPos > 40) {
      navbar.addClass("scrolled");
    } else {
      navbar.removeClass("scrolled");
    }
  }

  $(window).on("scroll", handleScroll);
  handleScroll();

  // Smooth Scrolling on Nav Click
  navLinks.on("click", function (e) {
    const targetId = $(this).attr("href");

    if (targetId && targetId.startsWith("#") && targetId.length > 1) {
      e.preventDefault();
      const target = $(targetId);

      if (target.length) {
        $("html, body")
          .stop()
          .animate(
            {
              scrollTop: target.offset().top - 72,
            },
            550,
          );

        if ($(".navbar-toggler").is(":visible")) {
          $(".navbar-collapse").collapse("hide");
        }
      }
    }
  });

  // Subtle Reveal Animation via IntersectionObserver
  const revealElements = document.querySelectorAll(".reveal-up");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = entry.target.getAttribute("data-delay") || 0;
            setTimeout(() => {
              entry.target.classList.add("is-visible");
            }, Number(delay));
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add("is-visible"));
  }
  // Dark / Light Mode Toggle (UMP45 Night Ops)
  const $html = $("html");
  const $themeToggle = $("#themeToggle");
  const $themeIcon = $("#themeIcon");

  function applyTheme(theme) {
    if (theme === "dark") {
      $html.attr("data-theme", "dark");
      $themeIcon.removeClass("fa-moon").addClass("fa-sun");
    } else {
      $html.removeAttr("data-theme");
      $themeIcon.removeClass("fa-sun").addClass("fa-moon");
    }
  }

  // Cek preferensi tersimpan atau preferensi OS pengguna
  const savedTheme = localStorage.getItem("yog-portfolio-theme");
  const currentHour = new Date().getHours();
  const isNightTime = currentHour >= 18 || currentHour < 6;

  // Prioritas: Pilihan manual di localStorage -> Jam malam (18:00 - 05:59)
  applyTheme(savedTheme || (isNightTime ? "dark" : "light"));

  $themeToggle.on("click", function () {
    const isDark = $html.attr("data-theme") === "dark";
    const nextTheme = isDark ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem("yog-portfolio-theme", nextTheme);
  });
  // Smooth Page Transition saat pindah antar halaman (index.html <-> audio-showcase.html)
  $('a[href$=".html"], a[href*=".html#"]').on("click", function (e) {
    const href = $(this).attr("href");
    const target = $(this).attr("target");

    // Abaikan jika dibuka di tab baru atau ada tombol modifier (Ctrl/Cmd + klik)
    if (
      !href ||
      target === "_blank" ||
      e.ctrlKey ||
      e.metaKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }

    e.preventDefault();
    $("body").addClass("page-leaving");

    setTimeout(() => {
      window.location.href = href;
    }, 260);
  });

  // Reset state jika user menekan tombol Back di browser (bfcache)
  $(window).on("pageshow", function (event) {
    if (event.originalEvent && event.originalEvent.persisted) {
      $("body").removeClass("page-leaving");
    }
  });
});

// Typed.js Role Animation
if (document.getElementById("typed")) {
  new Typed("#typed", {
    strings: [
      "Web Developer",
      "System Implementer",
      "Certified Network Associate",
      "Cybersecurity Enthusiast",
      "Personal Audio Enthusiast",
    ],
    typeSpeed: 48,
    backSpeed: 28,
    backDelay: 2200,
    loop: true,
    cursorChar: "_",
  });
}
