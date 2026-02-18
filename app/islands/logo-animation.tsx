import { useEffect, useRef } from "hono/jsx";
import {
  LETTERS,
  PATHS,
  LOGO_BASE_WIDTH,
  EXPAND_PER_ROW,
  ROW_HEIGHT,
  LOGO_COLOR_BLUE,
  DEFAULT_ROWS,
  DEFAULT_GAP,
  DEFAULT_INTENSITY,
  DEFAULT_DURATION,
  DEFAULT_HOLD,
  generateRowShares,
} from "../lib/logo-constants";

const ROWS = DEFAULT_ROWS;
const GAP = DEFAULT_GAP;
const COLOR = LOGO_COLOR_BLUE;
const CONTAINER_WIDTH = LOGO_BASE_WIDTH + GAP * 4 + EXPAND_PER_ROW;
const HEIGHT = ROW_HEIGHT * ROWS + GAP * (ROWS - 1);
const STIFFNESS = 70 / DEFAULT_DURATION;
const DAMPING = 0.7 * 2 * Math.sqrt(STIFFNESS);

function springStep(
  current: number,
  target: number,
  velocity: number,
  dt: number,
) {
  const force = -STIFFNESS * (current - target);
  const dampForce = -DAMPING * velocity;
  const newVelocity = velocity + (force + dampForce) * dt;
  const newValue = current + newVelocity * dt;
  return { value: newValue, velocity: newVelocity };
}

// Each row has these animated elements that need direct DOM updates:
// U-R group (transform), U-bar rect (width)
// I group (transform)
// L group (transform), L-bar rect (width)
// A group (transform), A-R group (transform), A-bar1 rect (width), A-bar2 rect (width)
// B group (transform), B-R group (transform), B-bar1/2/3 rects (width)

function updateRow(row: number, exps: number[]) {
  const [uExp, lExp, aExp, bExp] = exps;

  const iX = LETTERS.U.width + uExp + GAP;
  const lX = iX + LETTERS.I.width + GAP;
  const aX = lX + LETTERS.L.width + lExp + GAP;
  const bX = aX + LETTERS.A.width + aExp + GAP;

  const el = (id: string) => document.getElementById(`r${row}-${id}`);

  // U
  el("U-R")?.setAttribute("transform", `translate(${uExp}, 0)`);
  el("U-bar")?.setAttribute("width", String(uExp + 6));

  // I
  el("I")?.setAttribute("transform", `translate(${iX}, 0)`);

  // L
  el("L")?.setAttribute("transform", `translate(${lX}, 0)`);
  el("L-bar")?.setAttribute("width", String(102 + lExp + 4));

  // A
  el("A")?.setAttribute("transform", `translate(${aX}, 0)`);
  el("A-R")?.setAttribute("transform", `translate(${aExp}, 0)`);
  el("A-bar1")?.setAttribute("width", String(aExp + 6));
  el("A-bar2")?.setAttribute("width", String(aExp + 6));

  // B
  el("B")?.setAttribute("transform", `translate(${bX}, 0)`);
  el("B-R")?.setAttribute("transform", `translate(${bExp}, 0)`);
  el("B-bar1")?.setAttribute("width", String(bExp + 6));
  el("B-bar2")?.setAttribute("width", String(bExp + 6));
  el("B-bar3")?.setAttribute("width", String(bExp + 6));
}

function LogoRowStatic({ rowIndex }: { rowIndex: number }) {
  const r = rowIndex;
  const maskId = `row${r}`;
  const id = (name: string) => `r${r}-${name}`;

  return (
    <g transform={`translate(0, ${r * (ROW_HEIGHT + GAP)})`}>
      {/* U */}
      <g>
        <g mask={`url(#${maskId}-U-L)`}>
          <path d={PATHS.U} fill={COLOR} />
        </g>
        <g id={id("U-R")} mask={`url(#${maskId}-U-R)`}>
          <path d={PATHS.U} fill={COLOR} />
        </g>
        <rect
          id={id("U-bar")}
          x={141}
          y={304}
          width={6}
          height={40}
          fill={COLOR}
        />
      </g>

      {/* I */}
      <g id={id("I")}>
        <rect width="64" height="344" fill={COLOR} />
      </g>

      {/* L */}
      <g id={id("L")}>
        <path d={PATHS.L} fill={COLOR} />
        <rect
          id={id("L-bar")}
          x={99}
          y={304}
          width={106}
          height={40}
          fill={COLOR}
        />
      </g>

      {/* A */}
      <g id={id("A")}>
        <g mask={`url(#${maskId}-A-L)`}>
          <path
            d={PATHS.A}
            fill={COLOR}
            fill-rule="evenodd"
            clip-rule="evenodd"
          />
        </g>
        <g id={id("A-R")} mask={`url(#${maskId}-A-R)`}>
          <path
            d={PATHS.A}
            fill={COLOR}
            fill-rule="evenodd"
            clip-rule="evenodd"
          />
        </g>
        <rect
          id={id("A-bar1")}
          x={141}
          y={0}
          width={6}
          height={40}
          fill={COLOR}
        />
        <rect
          id={id("A-bar2")}
          x={141}
          y={112}
          width={6}
          height={40}
          fill={COLOR}
        />
      </g>

      {/* B */}
      <g id={id("B")}>
        <g mask={`url(#${maskId}-B-L)`}>
          <path
            d={PATHS.B}
            fill={COLOR}
            fill-rule="evenodd"
            clip-rule="evenodd"
          />
        </g>
        <g id={id("B-R")} mask={`url(#${maskId}-B-R)`}>
          <path
            d={PATHS.B}
            fill={COLOR}
            fill-rule="evenodd"
            clip-rule="evenodd"
          />
        </g>
        <rect
          id={id("B-bar1")}
          x={147}
          y={0}
          width={6}
          height={40}
          fill={COLOR}
        />
        <rect
          id={id("B-bar2")}
          x={147}
          y={112}
          width={6}
          height={40}
          fill={COLOR}
        />
        <rect
          id={id("B-bar3")}
          x={147}
          y={304}
          width={6}
          height={40}
          fill={COLOR}
        />
      </g>
    </g>
  );
}

export default function LogoAnimation() {
  useEffect(() => {
    const current = Array.from({ length: ROWS }, (_, r) =>
      generateRowShares(r * 1000, DEFAULT_INTENSITY),
    );
    const velocities = Array.from({ length: ROWS }, () => [0, 0, 0, 0]);
    let targets = current.map((row) => [...row]);

    // Set initial positions
    for (let r = 0; r < ROWS; r++) {
      updateRow(r, current[r]);
    }

    // Periodically update targets
    let frame = 0;
    const updateTargets = () => {
      frame++;
      targets = Array.from({ length: ROWS }, (_, r) =>
        generateRowShares(r * 1000 + frame * 500, DEFAULT_INTENSITY),
      );
    };

    let targetIntervalId = setInterval(
      updateTargets,
      (DEFAULT_DURATION + DEFAULT_HOLD) * 1000,
    );

    // rAF animation loop
    let lastTime = performance.now();
    let rafId: number;

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      for (let r = 0; r < ROWS; r++) {
        for (let i = 0; i < 4; i++) {
          const result = springStep(
            current[r][i],
            targets[r][i],
            velocities[r][i],
            dt,
          );
          current[r][i] = result.value;
          velocities[r][i] = result.velocity;
        }
        updateRow(r, current[r]);
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(targetIntervalId);
    };
  }, []);

  return (
    <svg
      viewBox={`0 0 ${CONTAINER_WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="w-full h-full"
    >
      <defs>
        {Array.from({ length: ROWS }, (_, r) => (
          <g key={r}>
            <mask id={`row${r}-U-L`}>
              <rect x={0} y={0} width={144} height={ROW_HEIGHT} fill="white" />
            </mask>
            <mask id={`row${r}-U-R`}>
              <rect
                x={144}
                y={0}
                width={1200}
                height={ROW_HEIGHT}
                fill="white"
              />
            </mask>
            <mask id={`row${r}-A-L`}>
              <rect x={0} y={0} width={144} height={ROW_HEIGHT} fill="white" />
            </mask>
            <mask id={`row${r}-A-R`}>
              <rect
                x={144}
                y={0}
                width={1200}
                height={ROW_HEIGHT}
                fill="white"
              />
            </mask>
            <mask id={`row${r}-B-L`}>
              <rect x={0} y={0} width={150} height={ROW_HEIGHT} fill="white" />
            </mask>
            <mask id={`row${r}-B-R`}>
              <rect
                x={150}
                y={0}
                width={1200}
                height={ROW_HEIGHT}
                fill="white"
              />
            </mask>
          </g>
        ))}
      </defs>
      {Array.from({ length: ROWS }, (_, r) => (
        <LogoRowStatic key={r} rowIndex={r} />
      ))}
    </svg>
  );
}
