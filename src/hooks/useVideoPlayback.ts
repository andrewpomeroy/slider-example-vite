import { create } from "zustand";
import { useEffect, useRef } from "react";

// Define a type for the state
type VideoState = {
  playing: boolean;
  currentTime: number;
  preCommitTime: number | null;
  setPreCommitTime: (time: number) => void;
  startTime: number;
  totalDuration: number;
  play: () => void;
  pause: () => void;
  tick: (frameTime: number) => void;
  skipTo: (time: number) => void;
};

// Create the Zustand store
export const useStore = create<VideoState>((set, get) => ({
  playing: false,
  currentTime: 0,
  preCommitTime: null,
  setPreCommitTime: (time: number) => {
    set({ preCommitTime: time });
  },
  startTime: 0,
  totalDuration: 0,
  play: () => {
    const { playing, currentTime, totalDuration, skipTo } = get();
    if (!playing) {
      const atEnd = currentTime === totalDuration;
      set({ playing: true, startTime: performance.now() - currentTime });
      if (atEnd) skipTo(0);
    }
  },
  pause: () => {
    get().tick(performance.now()); // Update currentTime before pausing
    set({ playing: false });
  },
  tick: (frameTime: number) => {
    const { startTime, totalDuration } = get();
    let currentTime = frameTime - startTime;
    if (currentTime >= totalDuration) {
      currentTime = totalDuration;
      set({ playing: false });
    }
    set({ currentTime });
  },
  skipTo: (time: number) => {
    const { totalDuration } = get();
    const clampedTime = Math.min(Math.max(time, 0), totalDuration);
    set({ currentTime: clampedTime });
    // If the video is playing, adjust the startTime to keep the animation smooth
    if (get().playing) {
      set({ startTime: performance.now() - clampedTime });
    }
  },
}));

// React hook that wraps the Zustand store
function useVideoPlayback(initialTime: number, totalDuration: number) {
  const state = useStore();
  const frameId = useRef<number>();

  // Initialize the state
  useEffect(() => {
    useStore.setState({
      currentTime: initialTime,
      totalDuration: totalDuration,
    });
  }, [initialTime, totalDuration]);

  // Effect for handling the play state and updating the current time
  useEffect(() => {
    const animate = (time: number) => {
      // console.log(
      //   "%c💣️ state.preCommitTime",
      //   "background: aliceblue; color: dodgerblue; font-weight: bold",
      //   state.preCommitTime
      // );
      state.tick(time);
      if (state.playing) {
        frameId.current = requestAnimationFrame(animate);
      }
    };

    if (state.playing) {
      frameId.current = requestAnimationFrame(animate);
    }

    return () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
    };
  }, [state]);

  // Expose play, pause, and currentTime
  return {
    play: state.play,
    pause: state.pause,
    playing: state.playing,
    currentTime: state.currentTime,
    skipTo: state.skipTo,
    setPreCommitTime: state.setPreCommitTime,
  };
}

export default useVideoPlayback;
