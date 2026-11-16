$(document).ready(function () {
  // Hero Image Card Shuffle on Click
  const heroImgContainer = $(".hero-img-container");
  let isShuffling = false;

  heroImgContainer.on("click", function () {
    if (isShuffling) return; // Mencegah spam klik saat animasi berjalan
    isShuffling = true;
    $("#shuffleHint").addClass("is-hidden");
    const $container = $(this);
    const isSwapped = $container.hasClass("is-swapped");
    const $frontImg = isSwapped
      ? $container.find(".hero-img-hover")
      : $container.find(".hero-img-original");
    const $backImg = isSwapped
      ? $container.find(".hero-img-original")
      : $container.find(".hero-img-hover");

    $frontImg.addClass("card-front");
    $backImg.addClass("card-back");
    $container.addClass("shuffling");

    setTimeout(() => {
      $container.toggleClass("is-swapped");
      $container.removeClass("shuffling");
      $frontImg.removeClass("card-front");
      $backImg.removeClass("card-back");
      isShuffling = false;
    }, 550);
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
