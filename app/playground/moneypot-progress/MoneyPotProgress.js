"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const MILESTONES = [0, 25, 50, 75, 100];
const DURATION = 600;
const EASING = "cubic-bezier(0.59,0.02,0.39,1)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function getClipPath(element, fallback) {
  const clipPath = getComputedStyle(element).clipPath;
  return clipPath && clipPath !== "none" ? clipPath : fallback;
}

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function MoneyPotProgress() {
  const [progress, setProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [view, setView] = useState("isolated");
  const simulationRunRef = useRef(0);

  useEffect(() => {
    return () => {
      simulationRunRef.current += 1;
    };
  }, []);

  const selectProgress = (value) => {
    simulationRunRef.current += 1;
    setIsSimulating(false);
    setProgress(value);
  };

  const simulateSaving = async () => {
    const runId = simulationRunRef.current + 1;
    simulationRunRef.current = runId;
    setIsSimulating(true);

    for (const value of MILESTONES) {
      if (simulationRunRef.current !== runId) {
        return;
      }

      setProgress(value);
      await wait(value === 0 ? 320 : 820);
    }

    if (simulationRunRef.current === runId) {
      setIsSimulating(false);
    }
  };

  const reset = () => {
    selectProgress(0);
  };

  return (
    <section className={styles.shell} aria-label="MoneyPot progress tracker">
      <div className={styles.viewTabs} aria-label="Prototype views">
        <button
          className={styles.viewTab}
          data-active={view === "isolated"}
          onClick={() => setView("isolated")}
          type="button"
        >
          Isolated Rail
        </button>
        <button
          className={styles.viewTab}
          data-active={view === "mobile"}
          onClick={() => setView("mobile")}
          type="button"
        >
          Mobile Card Context
        </button>
      </div>

      <div className={styles.prototypeStage}>
        {view === "isolated" ? (
          <IsolatedRailView progress={progress} />
        ) : (
          <MobileCardContext progress={progress} />
        )}
      </div>

      <div className={styles.controls} aria-label="Set progress">
        {MILESTONES.map((value) => (
          <button
            className={styles.stepButton}
            data-selected={value === progress}
            disabled={isSimulating}
            key={value}
            onClick={() => selectProgress(value)}
            type="button"
          >
            {value}%
          </button>
        ))}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.primaryButton}
          disabled={isSimulating}
          onClick={simulateSaving}
          type="button"
        >
          {isSimulating ? "Saving..." : "Simulate saving"}
        </button>
        <button className={styles.secondaryButton} onClick={reset} type="button">
          Reset
        </button>
      </div>
    </section>
  );
}

function IsolatedRailView({ progress }) {
  return (
    <div className={styles.isolatedPanel}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>MoneyPot</p>
        <h1 className={styles.title}>Savings progress</h1>
        <div className={styles.status} aria-live="polite">
          {progress}%
        </div>
      </div>

      <div className={styles.tracker}>
        <ProgressRail progress={progress} />
      </div>
    </div>
  );
}

function MobileCardContext({ progress }) {
  return (
    <div className={styles.mobileFrame} aria-label="Credo MoneyPot context">
      <div className={styles.phoneStatus}>
        <span>9:41</span>
        <div className={styles.phoneIcons} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>

      <section className={styles.moneyPotCard}>
        <div className={styles.cardActions} aria-hidden="true">
          <span>⋮</span>
          <span>×</span>
        </div>
        <p className={styles.cardTitle}>კარლამ ლიკარტიანის დაბადების დღე</p>
        <div className={styles.cardAmount}>250.00₾</div>
        <p className={styles.cardSubtitle}>შეგროვებული თანხა</p>
        <div className={styles.cardProgressLabel} aria-live="polite">
          {progress}%
        </div>

        <div className={styles.cardRail}>
          <ProgressRail progress={progress} />
        </div>

        <div className={styles.cardMeta}>
          <div>
            <span>დასრულების დრო</span>
            <strong>25 იან. 2024</strong>
          </div>
          <div>
            <span>ასაგროვებელი თანხა</span>
            <strong>350.00₾</strong>
          </div>
        </div>
      </section>

      <section className={styles.mobilePlaceholder}>
        <div>
          <p>მონაწილეები</p>
          <div className={styles.avatarRow}>
            <span>სო</span>
            <span />
            <span />
            <span>+3</span>
          </div>
        </div>
        <span className={styles.chevron}>›</span>
      </section>

      <section className={styles.mobilePlaceholder}>
        <div>
          <p>გასაზიარებელი ბმული</p>
          <strong>https://credobank.ge/collectmo...</strong>
        </div>
        <span className={styles.shareDot}>⌯</span>
      </section>
    </div>
  );
}

function ProgressRail({ progress }) {
  const railRef = useRef(null);
  const activeLayerRef = useRef(null);
  const activeTargetRef = useRef(null);
  const hasMountedRef = useRef(false);
  const currentIndex = MILESTONES.indexOf(progress);

  const getInitialClipPath = () => {
    return "inset(0 100% 0 0)";
  };

  const getTargetMeasurements = () => {
    const rail = railRef.current;
    const activeLayer = activeLayerRef.current;
    const target = activeTargetRef.current;

    if (!rail || !activeLayer || !target) {
      return null;
    }

    const targetRect = target.getBoundingClientRect();
    const activeLayerRect = activeLayer.getBoundingClientRect();
    let clipPath = getInitialClipPath();

    if (currentIndex === MILESTONES.length - 1) {
      clipPath = "inset(0 0% 0 0)";
    } else if (currentIndex > 0) {
      const revealPx = targetRect.right - activeLayerRect.left;
      const revealPercent = (revealPx / activeLayerRect.width) * 100;
      clipPath = `inset(0 ${100 - revealPercent}% 0 0)`;
    }

    return { clipPath };
  };

  useLayoutEffect(() => {
    const activeLayer = activeLayerRef.current;
    const measurements = getTargetMeasurements();

    if (!activeLayer || !measurements) {
      return;
    }

    const targetClipPath = measurements.clipPath;

    if (!hasMountedRef.current || prefersReducedMotion()) {
      hasMountedRef.current = true;
      activeLayer.style.clipPath = targetClipPath;
      return;
    }

    const currentClipPath = getClipPath(activeLayer, getInitialClipPath());

    activeLayer.getAnimations().forEach((animation) => animation.cancel());
    activeLayer.style.clipPath = currentClipPath;

    const activeLayerAnimation = activeLayer.animate(
      [{ clipPath: currentClipPath }, { clipPath: targetClipPath }],
      {
        duration: DURATION,
        easing: EASING,
        fill: "forwards",
      },
    );

    activeLayerAnimation.onfinish = () => {
      activeLayer.style.clipPath = targetClipPath;
      activeLayerAnimation.cancel();
    };
  }, [currentIndex]);

  return (
    <div ref={railRef} className={styles.rail}>
      <RailLayer tone="base" />
      <RailLayer
        tone="active"
        activeLayerRef={activeLayerRef}
        activeTargetRef={activeTargetRef}
        currentIndex={currentIndex}
      />
    </div>
  );
}

function RailLayer({ activeLayerRef, activeTargetRef, currentIndex, tone }) {
  const isActive = tone === "active";

  return (
    <div
      ref={activeLayerRef}
      className={`${styles.railLayer} ${isActive ? styles.activeLayer : ""}`}
      style={isActive ? { clipPath: "inset(0 100% 0 0)" } : undefined}
      aria-hidden={isActive ? true : undefined}
    >
      {MILESTONES.slice(0, -1).map((value, index) => (
        <div className={styles.segment} key={value}>
          <span
            ref={isActive && index === currentIndex ? activeTargetRef : null}
            data-milestone-index={index}
            className={styles.dot}
          />
          <span className={styles.bar} />
        </div>
      ))}
      <span
        ref={
          isActive && currentIndex === MILESTONES.length - 1
            ? activeTargetRef
            : null
        }
        data-milestone-index={MILESTONES.length - 1}
        className={styles.dot}
      />
    </div>
  );
}
