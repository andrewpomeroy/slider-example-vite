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
  const chapterSegments = getChapterSegments(CHAPTERS, TOTAL_TIME);
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
    <div className="flex flex-col items-center justify-center w-full">
      {/* Slider */}
      <div className="relative flex items-center justify-center w-full">
        <motion.div
          animate={state}
          onMouseDown={(event) => {
            event.preventDefault();
            setPressed(true);
            setNewProgress(event);
          }}
          // TODO: onMouseUp doesn't fire when you release the mouse outside the slider
          onMouseUp={() => setPressed(false)}
          onMouseMove={handleMouseMove}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          style={{
            height: TRACK_HEIGHT_HOVERED + TRACK_BUFFER,
            paddingTop: TRACK_BUFFER,
            paddingBottom: TRACK_BUFFER,
          }}
          className="flex w-full items-center justify-center relative touch-none cursor-pointer grow-0"
          initial={false}
          ref={ref}
        >
          <motion.div
            className="relative w-full flex flex-col items-center justify-center"
            style={{
              height: TRACK_HEIGHT_INITIAL,
            }}
          >
            <div className="w-full flex-1 bg-white/20" />
            {chapterSegments.map((segment, index) => {
              return (
                <ChapterSegment
                  isFirst={index === 0}
                  isLast={index === chapterSegments.length - 1}
                  background={"bg-gray-500"}
                  segment={segment}
                  totalTime={TOTAL_TIME}
                  currentTime={TOTAL_TIME}
                  key={index}
                />
              );
            })}
            {chapterSegments.map((segment, index) => {
              return (
                <ChapterSegment
                  isFirst={index === 0}
                  isLast={index === chapterSegments.length - 1}
                  background={"bg-primary"}
                  segment={segment}
                  totalTime={TOTAL_TIME}
                  currentTime={currentTime}
                  key={index}
                />
              );
            })}
          </motion.div>
          {/* Pointer-tooltip surrogate */}
          <div className="pointer-events-none">
            <Tooltip open={hovered && !knobHovered && !pressed}>
              <TooltipTrigger asChild>
                <motion.div
                  className="absolute left-0 top-0 h-full"
                  style={{
                    x: tooltipX,
                  }}
                  aria-hidden={true}
                >
                  <motion.div
                    className={`absolute left-[-.5px] top-0 w-[1px] h-full bg-blue-300 ${
                      hovered && !knobHovered ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent asChild>
                <motion.div>{tooltipContent}</motion.div>
              </TooltipContent>
            </Tooltip>
          </div>
          {/* Knob */}
          <div
            style={{
              transform: `translateX(calc(${knobTransformX}px - 50%))`,
            }}
            className={`absolute left-0 top-50% origin-center ${
              pressed ? "cursor-grabbing" : "cursor-grab"
            }`}
            onMouseEnter={() => setKnobHovered(true)}
            onMouseLeave={() => setKnobHovered(false)}
          >
            <motion.div
              className={`w-4 h-4 m-1 bg-white rounded-full shadow-lg origin-center transition-all
              `}
            />
          </div>
        </motion.div>
      </div>
      {/* Current time */}
      <motion.div
        initial={false}
        animate={{
          color: hovered || pressed ? "rgb(255,255,255)" : "rgb(120,113,108)",
        }}
        className={`select-none mt-2 text-center text-sm font-semibold tabular-nums`}
      >
        {currentTimeDisplay} / {msToTime(TOTAL_TIME)}
      </motion.div>
      <button className="mt-2" onClick={() => (playing ? pause() : play())}>
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
