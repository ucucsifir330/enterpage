<script setup lang="ts">
/**
 * ShowroomTurntable
 *
 * 5 kapı ReactBits orbit mantığıyla yatay elips üzerinde döner.
 * Scroll eşiklerinde snap yapar: aktif kapı merkezde büyük, yan kapılar flu/küçük.
 */

import { computed } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

type Door = {
  id: string;
  name: { tr: string; en: string };
  nameDisplay: { lead: string; tail: string };
  series: { tr: string; en: string };
  image: string;
  spec: { tr: string; en: string };
  meta: { tr: string; en: string };
};

const IK_BASE = "https://ik.imagekit.io/kardoor";
const ik = (path: string, ver: string) =>
  `${IK_BASE}/${path}?tr=f-webp,q-82&updatedAt=${ver}`;

const LOREM_TR =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
const LOREM_EN =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
const META_TR = "Çelik gövde · 80mm · Akustik yalıtım";
const META_EN = "Steel core · 80mm · Acoustic insulation";

const doors: Door[] = [
  {
    id: "ivory-line",
    name: { tr: "Ivory Line", en: "Ivory Line" },
    nameDisplay: { lead: "Ivory", tail: "Line" },
    series: { tr: "Atelier Serisi", en: "Atelier Series" },
    image: ik("series/1.png", "1778762643897"),
    spec: { tr: LOREM_TR, en: LOREM_EN },
    meta: { tr: META_TR, en: META_EN }
  },
  {
    id: "graphite-oak",
    name: { tr: "Graphite Oak", en: "Graphite Oak" },
    nameDisplay: { lead: "Graphite", tail: "Oak" },
    series: { tr: "Atelier Serisi", en: "Atelier Series" },
    image: ik("series/2.png", "1778762645386"),
    spec: { tr: LOREM_TR, en: LOREM_EN },
    meta: { tr: META_TR, en: META_EN }
  },
  {
    id: "classic-sand",
    name: { tr: "Classic Sand", en: "Classic Sand" },
    nameDisplay: { lead: "Classic", tail: "Sand" },
    series: { tr: "Atelier Serisi", en: "Atelier Series" },
    image: ik("series/3.png", "1778762644382"),
    spec: { tr: LOREM_TR, en: LOREM_EN },
    meta: { tr: META_TR, en: META_EN }
  },
  {
    id: "emerald-line",
    name: { tr: "Emerald Line", en: "Emerald Line" },
    nameDisplay: { lead: "Emerald", tail: "Line" },
    series: { tr: "Atelier Serisi", en: "Atelier Series" },
    image: ik("series/4.png", "1778762645568"),
    spec: { tr: LOREM_TR, en: LOREM_EN },
    meta: { tr: META_TR, en: META_EN }
  },
  {
    id: "mono-graphite",
    name: { tr: "Mono Graphite", en: "Mono Graphite" },
    nameDisplay: { lead: "Mono", tail: "Graphite" },
    series: { tr: "Atelier Serisi", en: "Atelier Series" },
    image: ik("series/5.png", "1778762645583"),
    spec: { tr: LOREM_TR, en: LOREM_EN },
    meta: { tr: META_TR, en: META_EN }
  }
];

const props = defineProps<{
  progress: number; // 0 → 1
}>();

const { locale } = useKardoorLocale();

const TOTAL_ROTATION = 360;
const STEP = TOTAL_ROTATION / doors.length;
const ORBIT_RADIUS_X = 360;
const ORBIT_RADIUS_Y = 50;

const degToRad = (deg: number) => (deg * Math.PI) / 180;
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Sürekli (float) kapı index'i — scrub progress'inden direkt türetilir.
// Math.round YOK; orbit pozisyonları sürekli interpolate edilir.
const floatIndex = computed(() =>
  clamp(props.progress * (doors.length - 1), 0, doors.length - 1)
);

// Info panel için yine ayrık (rounded) index — sadece Vue Transition tetiklensin.
const activeIndex = computed(() => Math.round(floatIndex.value));

const orbitDoors = computed(() => {
  const count = doors.length;
  const f = floatIndex.value;

  return doors.map((door, i) => {
    const rawOffset = i - f;
    let offset = rawOffset;
    if (offset > count / 2) offset -= count;
    if (offset < -count / 2) offset += count;

    const distance = Math.abs(offset);
    const angle = offset * STEP;
    const rad = degToRad(angle);
    const x = Math.sin(rad) * ORBIT_RADIUS_X;
    const y = (1 - Math.cos(rad)) * ORBIT_RADIUS_Y;

    // ── Sürekli eğriler ────────────────────────────────────────
    // distance: 0 = aktif, 1 = komşu, 2+ = uzak
    const nearActive = clamp(1 - distance, 0, 1); // 1 → 0
    const nearNeighbor = clamp(1 - Math.abs(distance - 1), 0, 1); // 0→1→0
    const farTail = clamp(distance - 1, 0, 1.5); // 0 → 1.5

    // Scale: aktif 1.22 → komşu 0.62 → uzak 0.5
    const scale =
      distance <= 1
        ? lerp(0.62, 1.22, nearActive)
        : Math.max(0.5, lerp(0.62, 0.5, clamp(distance - 1, 0, 1)));

    // Opacity: aktif 1 → komşu 0.34 → uzak 0
    const baseOpacity =
      distance <= 1
        ? lerp(0.34, 1, nearActive)
        : Math.max(0, lerp(0.34, 0, clamp(distance - 1, 0, 1)));
    const lastDoorApproach = clamp((f - (count - 1.82)) / 0.18, 0, 1);
    const isWrappedTrailingDoor = rawOffset < -count / 2;
    const trailingFade = isWrappedTrailingDoor ? 1 - lastDoorApproach : 1;
    const isTrailingHidden = isWrappedTrailingDoor && lastDoorApproach >= 0.01;
    const opacity = isTrailingHidden ? 0 : baseOpacity * trailingFade;

    // Blur: aktif 0 → komşu 7 → uzak 10
    const blur =
      distance <= 1
        ? lerp(7, 0, nearActive)
        : Math.min(10, lerp(7, 10, clamp(distance - 1, 0, 1)));

    // zIndex sürekli mesafeye göre — aktife en yakın olan üstte
    const zIndex = isTrailingHidden ? -1 : Math.round(40 - distance * 12);

    // Aktife yakın olduğunda hafifçe yükselsin (cinematic lift)
    const lift = nearActive * -6;

    return {
      door,
      x,
      y: y + lift,
      scale: isTrailingHidden ? 0.001 : scale,
      opacity,
      blur: isTrailingHidden ? 16 : blur,
      zIndex,
      angle,
      nearActive,
      nearNeighbor,
      farTail
    };
  });
});

const activeDoor = computed(() => doors[activeIndex.value]!);
const doorNumber = computed(() => String(activeIndex.value + 1).padStart(2, "0"));
const totalDoors = String(doors.length).padStart(2, "0");

const t = (key: { tr: string; en: string }) =>
  locale.value === "tr" ? key.tr : key.en;

const ui = computed(() =>
  locale.value === "tr"
    ? { detail: "Detay", quote: "Teklif al" }
    : { detail: "Detail", quote: "Get quote" }
);
</script>

<template>
  <div class="showroom-turntable">
    <!-- ATMOSPHERE LAYERS -->
    <div class="showroom-turntable__vignette" aria-hidden="true" />
    <div class="showroom-turntable__grain" aria-hidden="true" />

    <!-- LEFT: STAGE -->
    <div class="showroom-turntable__stage">
      <!-- Backdrop typography (kapının arkasında dev isim) -->
      <div class="showroom-turntable__backdrop" aria-hidden="true">
        <Transition name="st-backdrop" mode="out-in">
          <span :key="activeDoor.id" class="showroom-turntable__backdrop-text">
            {{ activeDoor.nameDisplay.lead.toUpperCase() }}
          </span>
        </Transition>
      </div>

      <!-- Spotlight cone -->
      <div class="showroom-turntable__spotlight" aria-hidden="true" />

      <!-- Orbit Carousel -->
      <div class="showroom-turntable__scene">
        <div class="showroom-turntable__carousel">
          <div
            v-for="item in orbitDoors"
            :key="item.door.id"
            class="showroom-turntable__slot"
            :style="{
              '--slot-x': `${item.x}px`,
              '--slot-y': `${item.y}px`,
              '--slot-scale': `${item.scale}`,
              '--slot-opacity': `${item.opacity}`,
              '--slot-blur': `${item.blur}px`,
              '--slot-non-active': `${1 - item.nearActive}`,
              '--slot-neighbor-rise': `calc(var(--showroom-neighbor-rise-y, 0px) * ${1 - item.nearActive})`,
              zIndex: item.zIndex
            }"
          >
            <img
              :src="item.door.image"
              :alt="t(item.door.name)"
              class="showroom-turntable__door-image"
              loading="lazy"
              decoding="async"
              draggable="false"
            >
          </div>
        </div>

        <!-- Floor disc (oval platform) -->
        <div class="showroom-turntable__platform" aria-hidden="true">
          <div class="showroom-turntable__platform-ring" />
          <div class="showroom-turntable__platform-glow" />
        </div>
      </div>
    </div>

    <!-- RIGHT: INFO PANEL -->
    <aside class="showroom-turntable__info" aria-live="polite">
      <Transition name="st-info" mode="out-in">
        <div :key="activeDoor.id" class="showroom-turntable__info-block">
          <div class="showroom-turntable__counter">
            <span>{{ doorNumber }}</span>
            <i />
            <span>{{ totalDoors }}</span>
          </div>

          <h2 class="showroom-turntable__name">
            <span class="showroom-turntable__name-lead">
              {{ activeDoor.nameDisplay.lead }}
            </span>
            <em class="showroom-turntable__name-tail">
              {{ activeDoor.nameDisplay.tail }}
            </em>
          </h2>

          <p class="showroom-turntable__series">
            {{ t(activeDoor.series) }}
          </p>

          <div class="showroom-turntable__divider" />

          <p class="showroom-turntable__spec">
            {{ t(activeDoor.spec) }}
          </p>

          <p class="showroom-turntable__meta">
            {{ t(activeDoor.meta) }}
          </p>

          <div class="showroom-turntable__actions">
            <button
              type="button"
              class="showroom-turntable__action showroom-turntable__action--primary"
            >
              {{ ui.detail }}
              <i aria-hidden="true">→</i>
            </button>
            <button type="button" class="showroom-turntable__action">
              {{ ui.quote }}
            </button>
          </div>
        </div>
      </Transition>

      <!-- Pagination dots -->
      <div class="showroom-turntable__dots" aria-hidden="true">
        <span
          v-for="(_, i) in doors"
          :key="i"
          class="showroom-turntable__dot"
          :class="{ 'showroom-turntable__dot--active': i === activeIndex }"
        />
      </div>
    </aside>
  </div>
</template>
