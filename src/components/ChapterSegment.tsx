import React from "react";
import { cn } from "../lib/utils";
import { CHAPTER_BUFFER_PX, TRACK_BUFFER } from "../constants";
import { trackHeightCn, hoverTrackHeightCn } from "../constants";

export function ChapterSegment({
  segment,
  currentTime,
  totalTime,
  isFirst,
  isLast,
  background,
}: {
  segment: any;
  currentTime: number;
  totalTime: number;
  isFirst: boolean;
  isLast: boolean;
  background: string;
}): JSX.Element {
  const { left, width } = getSegmentTransforms(segment, {
    currentTime,
    totalTime,
    isFirst,
    isLast,
  });
  return (
    <div
      style={{
        left,
        width,
        top: "50%",
        paddingTop: TRACK_BUFFER,
        paddingBottom: TRACK_BUFFER,
        boxSizing: "content-box",
        backgroundClip: "content-box",
      }}
      className={cn(
        "absolute translate-y-[-50%] inset-0",
        trackHeightCn,
        hoverTrackHeightCn,
        background
      )}
    />
  );
}

const getSegmentTransforms = (
  segment: { start: number; end: number; },
  {
    currentTime, totalTime, isFirst, isLast,
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
  const left = `calc(${(segment.start / totalTime) * 100}% + ${!isFirst ? CHAPTER_BUFFER_PX * 2 : 0}px)`;
  // const width = `${(segmentTimeElapsed / totalTime) * 100}%`;
  const width = `calc(${(segmentTimeElapsed / totalTime) * 100}% - ${isFirst || isLast ? 0 : CHAPTER_BUFFER_PX * 2}px)`;
  return {
    left,
    width,
  };
};
