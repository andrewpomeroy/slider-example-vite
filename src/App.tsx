import {
  motion,
  MotionConfig,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useEffect, useState } from "react";
import useMeasure from "react-use-measure";
import Slider from "../src/components/Slider";
import { TooltipProvider } from "../src/components/ui/tooltip";

export default function App() {
  return (
    <MotionConfig transition={transition}>
      <TooltipProvider>
        <div className="flex items-center justify-center h-full max-h-[800px] py-16">
          <div className="w-[375px] h-full bg-gray-800 rounded-2xl flex flex-col justify-center px-4">
            <div className="flex flex-1 flex-col items-center justify-center">
              <Slider />
            </div>
          </div>
        </div>
      </TooltipProvider>
    </MotionConfig>
  );
}

let transition = { type: "spring", bounce: 0, duration: 0.3 };
