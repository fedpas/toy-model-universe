import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initCascadeScrollEngine(setStepState, trigger) {
  const scrollTrigger = ScrollTrigger.create({
    trigger,
    start: 'top top+=20',
    end: '+=1200',
    scrub: 1,
    pin: true,
    anticipatePin: 1,
    onUpdate: ({ progress }) => setStepState(Math.min(3, Math.floor(progress * 4))),
  });
  return () => scrollTrigger.kill();
}
