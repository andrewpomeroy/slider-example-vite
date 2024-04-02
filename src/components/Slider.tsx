import { motion, useMotionValue, useTransform } from "framer-motion";
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

const Slider = ({}) => {
  const initialHeight = 4;
  const height = 8;
  const buffer = 12;
  const [ref, bounds] = useMeasure();
  const [hovered, setHovered] = useState(false);
  const [knobHovered, setKnobHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [timelineMouseX, setTimelineMouseX] = useState(0);
  const [tooltipContent, setTooltipContent] = useState("");
  const { play, pause, playing, skipTo, setPreCommitTime } = useVideoPlayback(
    0,
    totalDuration
  );
  const progressDisplayTime = useMotionValue<number>(0);

  useEffect(() => {
    const unsubscribe = useStore.subscribe((state) => {
      if (!pressed) {
        progressDisplayTime.set(state.currentTime);
      } else if (state.preCommitTime !== null) {
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

  const absoluteToRelativeXPosition = useCallback(
    (event: React.MouseEvent<HTMLElement> | MouseEvent) => {
      const clientX =
        "nativeEvent" in event && event.nativeEvent instanceof MouseEvent
          ? event.nativeEvent.clientX
          : event.clientX;
      const { left } = bounds;
      return clientX - left;
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

  const updateCursorX = useCallback(
    (x: number) => {
      setTimelineMouseX(clamp(x, 0, bounds.width));
      setTooltipContent(progressRatioToTime(x / bounds.width));
    },
    [progressRatioToTime, bounds]
  );

  const updateProgressX = useCallback(
    (x: number) => {
      const newProgress = clamp(x / bounds.width, 0, 1);
      setPreCommitTime(newProgress * totalDuration);
    },
    [bounds, updateCursorX, totalDuration, setPreCommitTime]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement> | MouseEvent, isDragging?: boolean) => {
      const event = ("nativeEvent" in e && e.nativeEvent) || (e as MouseEvent);
      const offsetX = absoluteToRelativeXPosition(event);
      updateCursorX(offsetX);
      if (pressed || isDragging) {
        updateProgressX(offsetX);
      }
    },
    [pressed, updateCursorX, updateProgressX, absoluteToRelativeXPosition]
  );

  const onMouseDown = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setPressed(true);
      const onMouseMove = (event: MouseEvent) => {
        // Using the boolean to force through a "pressed" state rather than wiring up a bunch of extra closure logic
        handleMouseMove(event, true);
      };
      const onMouseUp = () => {
        setPressed(false);
        commitTime();
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("mousemove", onMouseMove);
      };
      // handleMouseMove(event);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("mousemove", onMouseMove);
      // Firing once initially, to respond to a simple click
      handleMouseMove(event, true);
    },
    [handleMouseMove]
  );

  const animationState = pressed ? "pressed" : hovered ? "hovered" : "idle";

  return (
    // SliderContainer
    <div className="SliderContainer">
      {/* Slider */}
      <div
        className="Slider"
        style={
          {
            "--slider-width": `${bounds.width}px`,
          } as React.CSSProperties
        }
      >
        {/* Slider-trackLayout */}
        <motion.div
          animate={animationState}
          onMouseDown={onMouseDown}
          onMouseMove={(event) => {
            if (!pressed) handleMouseMove(event);
          }}
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
              top: "50%",
              y: "-50%",
              x: knobTransformX,
            }}
            className={`Slider-knobTouchTarget ${
              pressed ? "Slider-knobTouchTarget--pressed" : ""
            }`}
            onMouseEnter={() => setKnobHovered(true)}
            onMouseLeave={() => setKnobHovered(false)}
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
