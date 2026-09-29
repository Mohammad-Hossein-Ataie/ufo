import Link from "next/link";
import { AlertTriangle, ArrowLeft, Info, Sparkles, Truck } from "lucide-react";
import type { SiteAnnouncement } from "@/lib/site-announcements";

const icons = {
  info: Info,
  truck: Truck,
  sparkles: Sparkles,
  alert: AlertTriangle,
};

function AnnouncementContent({ announcement }: { announcement: SiteAnnouncement }) {
  const Icon = announcement.icon === "none" ? null : icons[announcement.icon];
  return (
    <span className="site-announcement-content">
      {Icon ? <Icon size={16} aria-hidden="true" /> : null}
      <span>{announcement.text}</span>
      {announcement.link ? <ArrowLeft size={15} aria-hidden="true" /> : null}
    </span>
  );
}

export function SiteAnnouncementBar({ announcements }: { announcements: SiteAnnouncement[] }) {
  if (announcements.length === 0) return null;
  return (
    <aside className="site-announcement-stack" aria-label="اطلاعیه‌های فروشگاه">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className="site-announcement"
          data-style={announcement.style}
          role="status"
        >
          {announcement.link ? (
            announcement.link.startsWith("/") ? (
              <Link href={announcement.link} className="site-announcement-link">
                <AnnouncementContent announcement={announcement} />
              </Link>
            ) : (
              <a
                href={announcement.link}
                target="_blank"
                rel="noopener noreferrer"
                className="site-announcement-link"
              >
                <AnnouncementContent announcement={announcement} />
              </a>
            )
          ) : (
            <AnnouncementContent announcement={announcement} />
          )}
        </div>
      ))}
    </aside>
  );
}
