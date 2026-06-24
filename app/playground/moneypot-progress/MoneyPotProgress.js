"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const MILESTONES = [0, 25, 50, 75, 100];
const DURATION = 600;
const EASING = "cubic-bezier(0.59,0.02,0.39,1)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function getTranslateX(element) {
  const transform = getComputedStyle(element).transform;

  if (!transform || transform === "none") {
    return 0;
  }

  return new DOMMatrixReadOnly(transform).m41;
}

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
  const railRef = useRef(null);
  const activeLayerRef = useRef(null);
  const indicatorRef = useRef(null);
  const activeTargetRef = useRef(null);
  const simulationRunRef = useRef(0);
  const hasMountedRef = useRef(false);

  const currentIndex = MILESTONES.indexOf(progress);

  const getTargetMeasurements = () => {
    const rail = railRef.current;
    const activeLayer = activeLayerRef.current;
    const indicator = indicatorRef.current;
    const target = activeTargetRef.current;

    if (!rail || !activeLayer || !indicator || !target) {
      return null;
    }

    const targetRect = target.getBoundingClientRect();
    const activeLayerRect = activeLayer.getBoundingClientRect();
    const indicatorParentRect = (
      indicator.offsetParent || rail
    ).getBoundingClientRect();
    const targetCenterX = targetRect.left + targetRect.width / 2;
    let clipPath = getInitialClipPath();

    if (currentIndex === MILESTONES.length - 1) {
      clipPath = "inset(0 0% 0 0)";
    } else if (currentIndex > 0) {
      const revealPx = targetRect.right - activeLayerRect.left;
      const revealPercent = (revealPx / activeLayerRect.width) * 100;
      clipPath = `inset(0 ${100 - revealPercent}% 0 0)`;
    }

    const translateX =
      targetCenterX - indicatorParentRect.left - indicator.offsetWidth / 2;

    return {
      clipPath,
      translateX,
    };
  };

  const getInitialClipPath = () => {
    return "inset(0 100% 0 0)";
  };

  useLayoutEffect(() => {
    const activeLayer = activeLayerRef.current;
    const indicator = indicatorRef.current;
    const measurements = getTargetMeasurements();

    if (!activeLayer || !indicator || !measurements) {
      return;
    }

    const targetTransform = `translateX(${measurements.translateX}px)`;
    const targetClipPath = measurements.clipPath;

    if (!hasMountedRef.current || prefersReducedMotion()) {
      hasMountedRef.current = true;
      indicator.style.transform = targetTransform;
      activeLayer.style.clipPath = targetClipPath;
      return;
    }

    const currentTransform = `translateX(${getTranslateX(indicator)}px)`;
    const currentClipPath = getClipPath(activeLayer, getInitialClipPath());

    indicator.getAnimations().forEach((animation) => animation.cancel());
    activeLayer.getAnimations().forEach((animation) => animation.cancel());

    indicator.style.transform = currentTransform;
    activeLayer.style.clipPath = currentClipPath;

    const timing = {
      duration: DURATION,
      easing: EASING,
      fill: "forwards",
    };

    const indicatorAnimation = indicator.animate(
      [{ transform: currentTransform }, { transform: targetTransform }],
      timing,
    );
    const activeLayerAnimation = activeLayer.animate(
      [{ clipPath: currentClipPath }, { clipPath: targetClipPath }],
      timing,
    );

    indicatorAnimation.onfinish = () => {
      indicator.style.transform = targetTransform;
      indicatorAnimation.cancel();
    };
    activeLayerAnimation.onfinish = () => {
      activeLayer.style.clipPath = targetClipPath;
      activeLayerAnimation.cancel();
    };
  }, [currentIndex]);

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
      <div className={styles.header}>
        <p className={styles.eyebrow}>MoneyPot</p>
        <h1 className={styles.title}>Savings progress</h1>
        <div className={styles.status} aria-live="polite">
          {progress}%
        </div>
      </div>

      <div className={styles.tracker}>
        <div
          ref={indicatorRef}
          className={styles.indicator}
          style={{ transform: "translateX(0px)" }}
        >
          <div className={styles.indicatorBadge}>{progress}%</div>
          <div className={styles.indicatorLine} />
        </div>

        <div ref={railRef} className={styles.rail}>
          <RailLayer tone="base" />
          <RailLayer
            tone="active"
            activeLayerRef={activeLayerRef}
            activeTargetRef={activeTargetRef}
            currentIndex={currentIndex}
          />
        </div>
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
