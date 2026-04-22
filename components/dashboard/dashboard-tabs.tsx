import Link from 'next/link';
import clsx from 'clsx';

export interface TabDef {
  id: string;
  label: string;
  href: string;
  adminOnly?: boolean;
  disabled?: boolean;
}

interface DashboardTabsProps {
  tabs: TabDef[];
  activeTab: string;
  className?: string;
}

/**
 * URL-param-driven tab bar. Tabs are plain Next.js Links so navigation is
 * deep-linkable, SSR-rendered, and works without JS. The parent page reads
 * `searchParams.tab` to decide which panel to render.
 *
 * Usage:
 *   const tab = (await searchParams).tab ?? 'all';
 *   <DashboardTabs tabs={[...]} activeTab={tab} />
 */
export function DashboardTabs({ tabs, activeTab, className }: DashboardTabsProps) {
  return (
    <div
      role="tablist"
      className={clsx(
        'flex overflow-x-auto border-b border-[color:var(--dc-edge)]',
        // Hide scrollbar on webkit while keeping scroll usable
        '[&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        const disabled = tab.disabled;
        return (
          <Link
            key={tab.id}
            href={disabled ? '#' : tab.href}
            role="tab"
            aria-selected={active}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            className={clsx(
              'relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors',
              // Active indicator: brand underline sits on top of the container border
              'border-b-2 -mb-px',
              active
                ? 'border-(--color-brand) text-dc-text'
                : 'border-transparent text-dc-text-3 hover:text-dc-text-2 hover:border-[color:var(--dc-edge-2)]',
              disabled && 'pointer-events-none opacity-40 select-none',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
