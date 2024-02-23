import React from "react";
import { cn } from "../lib/utils";
import { TRACK_BUFFER } from "../constants";
import { getSegmentTransforms } from "./Slider";
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
