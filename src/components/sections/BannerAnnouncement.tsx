"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { FC } from "react";
import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import type { BannerAnnouncement as BannerAnnouncementType } from "../../../sanity.types";

interface BannerAnnouncementProps {
  announcements: BannerAnnouncementType[];
}

export const BannerAnnouncement: FC<BannerAnnouncementProps> = ({
  announcements,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");

  if (!announcements || announcements.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    setDirection("left");
    setCurrentIndex((prev) =>
      prev === 0 ? announcements.length - 1 : prev - 1,
    );
  };

  const handleNext = () => {
    setDirection("right");
    setCurrentIndex((prev) =>
      prev === announcements.length - 1 ? 0 : prev + 1,
    );
  };

  const showNavigation = announcements.length > 1;

  const variants = {
    enter: (direction: "left" | "right") => ({
      x: direction === "right" ? 100 : -100,
      opacity: 0,
      filter: "blur(4px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
    },
    exit: (direction: "left" | "right") => ({
      x: direction === "right" ? -100 : 100,
      opacity: 0,
      filter: "blur(4px)",
    }),
  };

  return (
    <>
      <div className="flex justify-between items-center gap-4 text-white container mx-auto py-2 px-2 lg:px-0 lg:py-1">
        {showNavigation && (
          <Button
            variant="light"
            size="icon-sm"
            className="size-6"
            onClick={handlePrevious}
          >
            <FaChevronLeft className="text-white size-3" />
          </Button>
        )}
        <div className="flex-1 overflow-hidden relative min-h-6 md:min-h-7 flex items-center">
          <AnimatePresence initial={false} custom={direction}>
            <motion.p
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="text-sm md:text-base text-center absolute inset-0 flex items-center justify-center"
            >
              <span className="text-sm">
                {announcements[currentIndex].text}
              </span>
            </motion.p>
          </AnimatePresence>
        </div>
        {showNavigation && (
          <Button
            variant="light"
            size="icon-sm"
            className="size-6"
            onClick={handleNext}
          >
            <FaChevronRight className="text-white size-3" />
          </Button>
        )}
      </div>
      <div className="h-px bg-muted w-full" />
    </>
  );
};
