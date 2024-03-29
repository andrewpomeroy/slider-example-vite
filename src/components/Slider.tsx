import { motion, useMotionValue, useTransform } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";
import useMeasure from "react-use-measure";
import { TooltipContent, TooltipTrigger, Tooltip } from "./ui/tooltip";
import useVideoPlayback from "../hooks/useVideoPlayback";
import { CHAPTER_BUFFER_PX, TOTAL_TIME } from "../constants";
import {
  TRACK_HEIGHT_INITIAL,
  TRACK_HEIGHT_HOVERED,
  TRACK_BUFFER,
} from "../constants";
import { ChapterSegment } from "./ChapterSegment";

const msToTime = (ms: number) => {
  if (!ms) return "00:00";
  if (ms === Infinity) {
  }
  return new Date(ms).toISOString().slice(14, -5);
};

const progressRatioToTime = (progressRatio: number) => {
  return msToTime(progressRatio * TOTAL_TIME);
};

const CHAPTERS = [0, 10000, 20000, 40000, 55000, 60000, 70000];

const getChapterSegments = (chapters: number[], endTime: number) => {
  const segments = chapters.map((chapter, index) => {
    const nextChapter = chapters[index + 1];
    const end = nextChapter || endTime;
    return {
      start: chapter,
      end,
    };
  });
  return segments;
};

export const getSegmentTransforms = (
  segment: { start: number; end: number },
  {
    currentTime,
    totalTime,
    isFirst,
    isLast,
  }: {
    currentTime: number;
    totalTime: number;
    isFirst: boolean;
    isLast: boolean;
  }
) => {
  const segmentTimeElapsed = Math.min(
    Math.max(0, currentTime - segment.start),
    segment.end - segment.start
  );
  // const left = `${(segment.start / totalTime) * 100}%`;
  const left = `calc(${(segment.start / totalTime) * 100}% + ${
    !isFirst ? CHAPTER_BUFFER_PX * 2 : 0
  }px)`;
  // const width = `${(segmentTimeElapsed / totalTime) * 100}%`;
  const width = `calc(${(segmentTimeElapsed / totalTime) * 100}% - ${
    isFirst || isLast ? 0 : CHAPTER_BUFFER_PX * 2
  }px)`;
  return {
    left,
    width,
  };
};

const Slider = ({}) => {
  const initialHeight = 4;
  const height = 8;
  const buffer = 12;
  const [ref, bounds] = useMeasure();
  const [hovered, setHovered] = useState(false);
  const [knobHovered, setKnobHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const mouseX = useMotionValue(0);
  const { play, pause, playing, currentTime, skipTo } = useVideoPlayback(
    0,
    TOTAL_TIME
  );
  const [tooltipContent, setTooltipContent] = useState(msToTime(currentTime));
  const state = pressed ? "pressed" : hovered ? "hovered" : "idle";
  const tooltipX = useTransform(mouseX, (v) => {
    return `calc(${v}px - 50%)`;
  });
  const progress = currentTime / TOTAL_TIME;
  const currentTimeDisplay = progressRatioToTime(progress);
  const width = `${progress * 100}%`;
  const knobTransformX = progress * bounds.width;

  useEffect(() => {
    mouseX.onChange((v) => {
      const progressRatio = clamp(v / bounds.width, 0, 1);
      setTooltipContent(String(progressRatioToTime(progressRatio)));
    });
  });

  const getTimelineCursorOffsetX = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const { clientX } = event.nativeEvent;
      const { left } = bounds;
      return clientX - left;
    },
    [bounds]
  );

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const offsetX = getTimelineCursorOffsetX(event);
    mouseX.set(offsetX);
    if (pressed) {
      setNewProgress(event);
    }
  };

  const setNewProgress = (event: React.MouseEvent<HTMLDivElement>) => {
    let newPercent = clamp(
      getTimelineCursorOffsetX(event) / bounds.width,
      0,
      1
    );
    skipTo(newPercent * TOTAL_TIME);
  };

  return (
    // SliderContainer
    <div className="SliderContainer">
      {/* Slider */}
      <div className="Slider">
        {/* Slider-trackLayout */}
        <motion.div
          animate={state}
          onMouseDown={(event) => {
            event.preventDefault();
            setPressed(true);
            setNewProgress(event);
          }}
          onMouseUp={() => setPressed(false)}
          onMouseMove={handleMouseMove}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          style={{
            height: height + buffer,
            paddingTop: buffer,
            paddingBottom: buffer,
          }}
          className="Slider-trackLayout"
          initial={false}
          ref={ref}
        >
          {/* Slider-track */}
          <motion.div
            initial={false}
            variants={{
              idle: { height: initialHeight },
              hovered: { height },
              pressed: { height },
            }}
            className="Slider-track"
          >
            {/* Slider-track-background */}
            <div className="Slider-track-background" />
            {/* Slider-track-fill */}
            <motion.div style={{ width }} className="Slider-track-fill" />
          </motion.div>
          {/* Pointer-tooltip surrogate */}
          {/* Slider-tooltipRoot */}
          <div className="Slider-tooltipRoot">
            <Tooltip open={hovered && !knobHovered && !pressed}>
              <TooltipTrigger asChild>
                {/* Slider-tooltipSurrogate */}
                <motion.div
                  className="Slider-tooltipSurrogate"
                  style={{
                    x: tooltipX,
                  }}
                  aria-hidden={true}
                >
                  {/* Slider-hoverTimeMarker */}
                  <motion.div
                    className={`Slider-hoverTimeMarker ${
                      hovered && !knobHovered ? "hovered" : ""
                    }`}
                  />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent asChild>
                {/* Slider-tooltipContent */}
                <motion.div>{tooltipContent}</motion.div>
              </TooltipContent>
            </Tooltip>
          </div>
          {/* Slider-knobTouchTarget */}
          <div
            style={{
              transform: `translateX(calc(${knobTransformX}px - 50%))`,
            }}
            className={`Slider-knobTouchTarget ${
              pressed ? "Slider-knobTouchTarget--pressed" : ""
            }`}
            onMouseEnter={() => setKnobHovered(true)}
            onMouseLeave={() => setKnobHovered(false)}
          >
            {/* Slider-knob */}
            <motion.div className="Slider-knob" />
          </div>
        </motion.div>
      </div>
      {/* Current time */}
      <motion.div
        initial={false}
        animate={{
          color: hovered || pressed ? "rgb(255,255,255)" : "rgb(120,113,108)",
        }}
        className={`CurrentTime ${hovered || pressed ? "hovered" : ""}`}
      >
        {currentTimeDisplay} / {msToTime(TOTAL_TIME)}
      </motion.div>
      <button
        className="PlayPauseButton"
        onClick={() => (playing ? pause() : play())}
      >
        {playing ? "Pause" : "Play"}
      </button>
    </div>
  );
};

let clamp = (num: number, min: number, max: number) =>
  Math.max(Math.min(num, max), min);

function roundTo(number: number, decimals: number): number {
  return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export default Slider;
