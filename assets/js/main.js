// navbar highlight
$(document).ready(function () {
  // Ambil semua link navigasi yang punya href diawali #
  var navLinks = $(".navbar-nav .nav-link");

  $(window).on("scroll", function () {
    var scrollPos = $(document).scrollTop();
    var offset = 100; // Jarak agar highlight muncul sebelum mentok atas

    navLinks.each(function () {
      var currLink = $(this);
      var targetId = currLink.attr("href");

      // Lewati jika href hanya '#' atau link eksternal (GitHub)
      if (targetId.startsWith("#") && targetId.length > 1) {
        var refElement = $(targetId);

        if (refElement.length) {
          if (
            refElement.position().top <= scrollPos + offset &&
            refElement.position().top + refElement.outerHeight() >
              scrollPos + offset
          ) {
            navLinks.removeClass("active");
            currLink.addClass("active");
          } else {
            currLink.removeClass("active");
          }
        }
      }
    });

    // Efek Navbar Scrolled
    if (scrollPos > 50) {
      $(".navbar").addClass("scrolled");
    } else {
      $(".navbar").removeClass("scrolled");
    }
  });

  // Smooth Scrolling saat Klik
  navLinks.on("click", function (e) {
    var targetId = $(this).attr("href");

    if (targetId.startsWith("#") && targetId.length > 1) {
      e.preventDefault();
      var target = $(targetId);

      if (target.length) {
        $("html, body")
          .stop()
          .animate(
            {
              scrollTop: target.offset().top - 75, // Sesuai tinggi navbar
            },
            600,
          );

        // Tutup menu mobile otomatis setelah klik
        if ($(".navbar-toggler").is(":visible")) {
          $(".navbar-collapse").collapse("hide");
        }
      }
    }
  });
});
var typed = new Typed("#typed", {
  strings: [
    "Web Developer",
    "Network Specialist",
    "Cybersecurity Enthusiast",
    "",
  ],
  typeSpeed: 50,
  backSpeed: 30,
  backDelay: 2000,
  loop: true,
  cursorChar: "_",
});
