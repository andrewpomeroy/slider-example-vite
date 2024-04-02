import {
  MotionValue,
  motion,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import React, { useCallback, useEffect, useState, useRef } from "react";
import useMeasure from "react-use-measure";
import { TooltipContent, TooltipTrigger, Tooltip } from "./ui/tooltip";
import useVideoPlayback, { useStore } from "../hooks/useVideoPlayback";
import {
  CHAPTER_BUFFER_PX,
  MOCK_START_TIME,
  MOCK_END_TIME,
} from "../constants";
import {
  TRACK_HEIGHT_INITIAL,
  TRACK_HEIGHT_HOVERED,
  TRACK_BUFFER,
} from "../constants";
import { ChapterSegment } from "./ChapterSegment";

const firstEventTimestamp = MOCK_START_TIME;
const lastEventTimestamp = MOCK_END_TIME;
const totalDuration = lastEventTimestamp - firstEventTimestamp;

const msToTime = (ms: number) => {
  if (!ms) return "00:00";
  if (ms === Infinity) {
  }
  return new Date(ms).toISOString().slice(14, -5);
};

const progressRatioToTime = (progressRatio: number) => {
  return msToTime(progressRatio * totalDuration);
};

// const CHAPTERS = [0, 10000, 20000, 40000, 55000, 60000, 70000];

// const getChapterSegments = (chapters: number[], endTime: number) => {
//   const segments = chapters.map((chapter, index) => {
//     const nextChapter = chapters[index + 1];
//     const end = nextChapter || endTime;
//     return {
//       start: chapter,
//       end,
//     };
//   });
//   return segments;
// };

// export const getSegmentTransforms = (
//   segment: { start: number; end: number },
//   {
//     currentTime,
//     totalTime,
//     isFirst,
//     isLast,
//   }: {
//     currentTime: number;
//     totalTime: number;
//     isFirst: boolean;
//     isLast: boolean;
//   }
// ) => {
//   const segmentTimeElapsed = Math.min(
//     Math.max(0, currentTime - segment.start),
//     segment.end - segment.start
//   );
//   // const left = `${(segment.start / totalTime) * 100}%`;
//   const left = `calc(${(segment.start / totalTime) * 100}% + ${
//     !isFirst ? CHAPTER_BUFFER_PX * 2 : 0
//   }px)`;
//   // const width = `${(segmentTimeElapsed / totalTime) * 100}%`;
//   const width = `calc(${(segmentTimeElapsed / totalTime) * 100}% - ${
//     isFirst || isLast ? 0 : CHAPTER_BUFFER_PX * 2
//   }px)`;
//   return {
//     left,
//     width,
//   };
// };

const Slider = ({}) => {
  const initialHeight = 4;
  const height = 8;
  const buffer = 12;
  const [ref, bounds] = useMeasure();
  const rootRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [knobHovered, setKnobHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  // const timelineMouseX = useMotionValue(0);
  const [timelineMouseX, setTimelineMouseX] = useState(0);
  const [tooltipContent, setTooltipContent] = useState("");
  const { play, pause, playing, skipTo, setPreCommitTime } = useVideoPlayback(
    0,
    totalDuration
  );
  const progressDisplayTime = useMotionValue<number>(0);

  // const currentTimeRef = useRef<number>();
  useEffect(() => {
    const unsubscribe = useStore.subscribe((state) => {
      // currentTimeRef.state.currentTime
      currentTimeValue.set(state.currentTime);
      if (!pressed) {
        progressDisplayTime.set(state.currentTime);
      }
    });
    return () => unsubscribe();
  }, [pressed]);

  useEffect(() => {
    const unsubscribe = useStore.subscribe((state) => {
      if (pressed && state.preCommitTime) {
        progressDisplayTime.set(state.preCommitTime);
      }
    });
    return () => unsubscribe();
  }, [pressed]);

  const progressTransformX = useTransform(progressDisplayTime, (v) => {
    return `calc(${v / totalDuration} * var(--slider-width))`;
  });

  const knobTransformX = useTransform(progressDisplayTime, (v) => {
    return `calc(${v / totalDuration} * var(--slider-width) - 50%)`;
  });

  const currentTimeValue = useMotionValue<number>(0);
  // const currentTimeString = useTransform(currentTimeValue, (v) => {
  //   return msToTime(v);
  // })
  const currentTimePct = useTransform(currentTimeValue, (v) => {
    return v / totalDuration;
  });

  const state = pressed ? "pressed" : hovered ? "hovered" : "idle";

  const absoluteToRelativeXPosition = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const { clientX } = event.nativeEvent;
      const { left } = bounds;
      return clientX - left;
    },
    [bounds]
  );

  const relativeXToProgress = useCallback(
    (x: number) => {
      return clamp(x / bounds.width, 0, 1);
    },
    [bounds]
  );

  const commitTime = () => {
    const newTime = useStore.getState().preCommitTime;
    setPreCommitTime(null);
    if (newTime != null) {
      skipTo(newTime);
    }
  };

  const updateProgressX = useCallback(
    (x: number) => {
      const relativeX = clamp(x - bounds.left, 0, bounds.width);
      updateCursorX(relativeX);
      const newProgress = clamp(relativeX / bounds.width, 0, 1);
      // progressDisplayTime.set(newProgress * totalDuration);
      setPreCommitTime(newProgress * totalDuration);
    },
    [bounds]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      // const offsetX = absoluteToRelativeXPosition(event);
      // timelineMouseX.set(offsetX);
      // if (pressed) {
      //   setNewProgress(event);
      // }

      // If dragging, pan event handler will take care of this
      if (!pressed) {
        const offsetX = absoluteToRelativeXPosition(event);
        updateCursorX(offsetX);
      }
    },
    [pressed, updateProgressX, absoluteToRelativeXPosition]
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (pressed) return;
      updateProgressX(absoluteToRelativeXPosition(event));
      commitTime();
    },
    [pressed, updateProgressX, absoluteToRelativeXPosition, commitTime]
  );

  const onPanX = (x: number) => {
    updateProgressX(x);
  };

  const onPanXEnd = useCallback(
    (x: number) => {
      updateProgressX(x);
      commitTime();
    },
    [skipTo, commitTime]
  );

  const updateCursorX = useCallback(
    (x: number) => {
      // timelineMouseX.set(x);
      setTimelineMouseX(clamp(x, 0, bounds.width));
      setTooltipContent(progressRatioToTime(x / bounds.width));
    },
    [progressRatioToTime, bounds]
  );

  return (
    // SliderContainer
    <div className="SliderContainer">
      {/* Slider */}
      <div
        className="Slider"
        ref={rootRef}
        style={
          {
            "--slider-width": `${bounds.width}px`,
          } as React.CSSProperties
        }
      >
        {/* Slider-trackLayout */}
        <motion.div
          animate={state}
          // onMouseDown={(event) => {
          //   event.preventDefault();
          //   setPressed(true);
          //   setNewProgress(event);
          // }}
          // TODO: onMouseUp doesn't fire when you release the mouse outside the slider
          // onMouseUp={() => setPressed(false)}
          // onMouseUp={handleClick}
          onMouseMove={handleMouseMove}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onPan={(event, info) => onPanX(info.point.x)}
          onPanStart={() => setPressed(true)}
          onPanEnd={(event, info) => {
            onPanXEnd(info.point.x);
            setPressed(false);
          }}
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
            <motion.div
              style={{
                width: progressTransformX,
              }}
              className="Slider-track-fill"
            />
          </motion.div>
          {/* Slider-tooltipRoot */}
          <motion.div
            className="Slider-tooltipRoot"
            style={{ x: timelineMouseX }}
          >
            <motion.div
              className={`Slider-tooltipParent ${
                hovered && !knobHovered && !pressed ? "hovered" : ""
              }`}
            >
              <div
                className={`Slider-hoverTimeMarker ${
                  hovered && !knobHovered && !pressed ? "hovered" : ""
                }`}
              />
              <div className="Slider-tooltipContent">{tooltipContent}</div>
            </motion.div>
          </motion.div>

          {/* Slider-knobTouchTarget */}
          <motion.div
            style={{
              left: 0,
              // left: ,
              top: "50%",
              // transform: `translate(calc(${knobTransformX}px - 50%), -50%)`,
              // transform: `translate(0, -50%)`,
              y: "-50%",
              // transform: `translate(-50%, -50%)`,
              x: knobTransformX,
            }}
            className={`Slider-knobTouchTarget ${
              pressed ? "Slider-knobTouchTarget--pressed" : ""
            }`}
            onMouseEnter={() => setKnobHovered(true)}
            onMouseLeave={() => setKnobHovered(false)}
            // drag="x"
            // dragConstraints={rootRef}
          >
            {/* Slider-knob */}
            <div className="Slider-knob" />
          </motion.div>
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
        <CurrentTimeDisplay />
        {/* {currentTimeDisplay} / {msToTime(totalDuration)} */}
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

const CurrentTimeDisplay = () => {
  // const currentTimeString = useTransform(currentTimeValue, (v) => {
  //   return msToTime(v);
  // });
  const [currentTimeValue, setCurrentTimeValue] = useState<string>("00:00");
  useEffect(() => {
    const unsubscribe = useStore.subscribe((state) => {
      const time = state.currentTime;
      setCurrentTimeValue(msToTime(time ?? 0));
    });
    return () => unsubscribe();
  });
  return <div className="CurrentTimeDisplay">{currentTimeValue}</div>;
};

export default Slider;
