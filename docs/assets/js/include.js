async function loadHTML(id, file, callback) {
  const el = document.getElementById(id);
  if (el) {
    const res = await fetch(file);
    el.innerHTML = await res.text();
    if (callback) callback(); // callback uitvoeren zodra geladen
  }
}

// laad de header en footer in
loadHTML("header-placeholder", "assets/partials/header.html", () => {
  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  mobileMenuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });

  // Smooth scroll effect for header
  let lastScroll = 0;
  const header = document.querySelector("header");

  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      header.classList.add("shadow-xl");
    } else {
      header.classList.remove("shadow-xl");
    }

    lastScroll = currentScroll;
  });

  // Add some interactive animations
  //   document.querySelectorAll('a').forEach(link => {
  //       link.addEventListener('mouseenter', function() {
  //           this.style.transform = 'translateY(-1px)';
  //       });

  //       link.addEventListener('mouseleave', function() {
  //           this.style.transform = 'translateY(0)';
  //       });
  //   });
});

loadHTML("footer-placeholder", "assets/partials/footer.html");
