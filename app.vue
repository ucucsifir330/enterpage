<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import EntranceDoor from "./EntranceDoor.vue";

let lenis: Lenis | undefined;

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger);

  lenis = new Lenis({
    lerp: 0.08, // Premium softness
    wheelMultiplier: 1,
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
});

onBeforeUnmount(() => {
  if (lenis) {
    lenis.destroy();
    lenis = undefined;
  }
});
</script>

<template>
  <main class="app-shell app-shell--day">
    <EntranceDoor />
  </main>
</template>

<style>
/* Lenis recommended base styles */
html.lenis, html.lenis body {
  height: auto;
}
.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}
.lenis.lenis-smooth [data-lenis-prevent] {
  overscroll-behavior: contain;
}
.lenis.lenis-stopped {
  overflow: hidden;
}
.lenis.lenis-scrolling iframe {
  pointer-events: none;
}
</style>
