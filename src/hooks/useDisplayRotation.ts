import { useCallback, useEffect, useRef, useState } from "react";
import { IApiDisplayResponseItem } from "@/backend/api/api.interface";

interface UseDisplayRotationProps {
  list: IApiDisplayResponseItem[];
  duration: number;
  onItemChange?: (item: IApiDisplayResponseItem, index: number) => void;
  onTransition?: (isTransitioning: boolean) => void;
}

export const useDisplayRotation = ({
  list,
  duration,
  onItemChange,
  onTransition,
}: UseDisplayRotationProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const currentItem = list[currentIndex];

  const nextItem = useCallback(() => {
    if (!list.length) return;
    
    setIsTransitioning(true);
    onTransition?.(true);
    
    setTimeout(() => {
      const nextIndex = (currentIndex + 1) % list.length;
      setCurrentIndex(nextIndex);
      onItemChange?.(list[nextIndex], nextIndex);
      setIsTransitioning(false);
      onTransition?.(false);
    }, 200);
  }, [currentIndex, list, onItemChange, onTransition]);

  useEffect(() => {
    if (!list.length) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(nextItem, duration * 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, list, duration, nextItem]);

  useEffect(() => {
    if (currentItem) {
      onItemChange?.(currentItem, currentIndex);
    }
  }, [currentItem, currentIndex, onItemChange]);

  return {
    currentItem,
    currentIndex,
    isTransitioning,
    nextItem,
  };
};