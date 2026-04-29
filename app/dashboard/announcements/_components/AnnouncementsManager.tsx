"use client";

import { useEffect, useState } from "react";

import type { AnnouncementWithMeta } from "@/lib/types/announcements";

import { AnnouncementTableClient } from "./AnnouncementTableClient";
import { CreateAnnouncementClient } from "./CreateAnnouncementClient";

interface DeptOption {
  id: string;
  name: string;
}

interface Props {
  initialAnnouncements: AnnouncementWithMeta[];
  departments: DeptOption[];
  canPostOrgWide: boolean;
}

export function AnnouncementsManager({
  initialAnnouncements,
  departments,
  canPostOrgWide,
}: Props) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);

  // Sync when router.refresh() delivers fresh server data (e.g. Spanish translations filled in)
  useEffect(() => {
    setAnnouncements(initialAnnouncements);
  }, [initialAnnouncements]);

  function handleCreated(ann: AnnouncementWithMeta) {
    setAnnouncements((prev) => {
      const next = [ann, ...prev];
      // Preserve sort: pinned first, then newest
      return next.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    });
  }

  function handleDeleted(id: string) {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
      <div className="lg:self-start">
        <CreateAnnouncementClient
          departments={departments}
          canPostOrgWide={canPostOrgWide}
          onCreated={handleCreated}
        />
      </div>
      <div className="min-w-0">
        <AnnouncementTableClient
          announcements={announcements}
          onDeleted={handleDeleted}
        />
      </div>
    </div>
  );
}
