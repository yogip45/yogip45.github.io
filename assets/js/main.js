// navbar highlight
$(document).ready(function () {
  // Ambil semua link navigasi yang punya href diawali #
  var navLinks = $(".navbar-nav .nav-link");

  $(window).on("scroll", function () {
    var scrollPos = $(document).scrollTop();
    var windowHeight = $(window).height();
    var docHeight = $(document).height();
    var offset = 150;

    if (scrollPos + windowHeight >= docHeight - 50) {
      navLinks.removeClass("active");
      $('.nav-link[href="#contact"]').addClass("active");
    } else {
      navLinks.each(function () {
        var currLink = $(this);
        var targetId = currLink.attr("href");

        if (targetId.startsWith("#") && targetId.length > 1) {
          var refElement = $(targetId);
          if (refElement.length) {
            var elementTop = refElement.position().top;
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
    "Junior Web Developer",
    "Certified Network Engineer",
    "Cybersecurity Enthusiast",
    "Audio Enthusiast",
    "Self Proclaimed Bookworm",
    "",
  ],
  typeSpeed: 50,
  backSpeed: 30,
  backDelay: 2000,
  loop: true,
  cursorChar: "_",
});
