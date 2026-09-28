// --- ScrollytellingController.js ---
// Integration logic for GSAP ScrollTrigger and React Three Fiber
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initUniverseScrollTour(camera, groupRef, onStepChange) {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#universe-scroll-container",
      start: "top top",
      end: "bottom bottom",
      scrub: 1, // Smoothly captures the user's scrolling speed
      pin: true // Locks the screen viewport until the 4 steps complete
    }
  });

  // Slide 1 to Slide 2: Witt Signature Split (Engages Bit 1)
  tl.to(camera.position, { x: 5, y: 3, z: 8, ease: "power1.inOut" }, 0.0)
    .to(groupRef.rotation, { z: Math.PI / 4, ease: "none" }, 0.0)
    .call(() => onStepChange(1), null, 0.2);

  // Slide 2 to Slide 3: Base-Fiber Grading Sieve (Engages Bit 2)
  tl.to(camera.position, { x: 0, y: 6, z: 4, ease: "power2.inOut" }, 0.3)
    .call(() => onStepChange(2), null, 0.5);

  // Slide 3 to Slide 4: Chiral Polarization & Weinberg 4/17 Glow (Engages Bit 3 & 4)
  tl.to(camera.position, { x: 2, y: 1, z: 5, ease: "power1.out" }, 0.7)
    .call(() => onStepChange(3), null, 0.8);

  return tl;
}
