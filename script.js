const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
);

document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i * 55, 260)}ms`;
  revealObserver.observe(el);
});

const dlEl = document.getElementById("dl-num");
if (dlEl) {
  const TARGET = 47_284_920;
  const DURATION = 2400;

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const runCounter = (startTime) => {
    const progress = Math.min((performance.now() - startTime) / DURATION, 1);
    dlEl.textContent = Math.round(easeOut(progress) * TARGET).toLocaleString();
    if (progress < 1) requestAnimationFrame(() => runCounter(startTime));
  };

  const counterObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      counterObserver.disconnect();
      requestAnimationFrame(() => runCounter(performance.now()));
    }
  });

  counterObserver.observe(dlEl);
}
