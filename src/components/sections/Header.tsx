import { Suspense } from "react";
import { getActiveBannerAnnouncements } from "@/sanity/lib/announcements";
import { BannerAnnouncement } from "./BannerAnnouncement";
import { Navigation } from "./Navigation";

export const Header = async () => {
  const announcements = await getActiveBannerAnnouncements();

  return (
    <header className="bg-background">
      <BannerAnnouncement announcements={announcements} />
      <Suspense fallback={<div className="h-24" />}>
        <Navigation />
      </Suspense>
    </header>
  );
};
