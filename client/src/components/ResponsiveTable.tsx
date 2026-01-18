import { ReactNode } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  render: (item: T, index: number) => ReactNode;
  mobileRender?: (item: T, index: number) => ReactNode;
  hideOnMobile?: boolean;
  mobileLabel?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  emptyMessage?: string;
  className?: string;
  mobileBreakpoint?: "sm" | "md" | "lg";
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: (item: T, index: number) => string;
  stickyHeader?: boolean;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = "Nenhum item encontrado",
  className,
  mobileBreakpoint = "md",
  onRowClick,
  rowClassName,
  stickyHeader = false,
}: ResponsiveTableProps<T>) {
  const breakpointClasses = {
    sm: { table: "hidden sm:table", cards: "sm:hidden" },
    md: { table: "hidden md:table", cards: "md:hidden" },
    lg: { table: "hidden lg:table", cards: "lg:hidden" },
  };

  const visibleColumns = columns.filter(col => !col.hideOnMobile);

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Desktop Table View */}
      <ScrollArea className={cn("w-full", breakpointClasses[mobileBreakpoint].table)}>
        <table className="w-full text-sm">
          <thead className={cn(
            "bg-muted/50 border-b",
            stickyHeader && "sticky top-0 z-10"
          )}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "text-left py-3 px-4 font-medium text-muted-foreground",
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((item, index) => (
              <tr
                key={keyExtractor(item, index)}
                onClick={() => onRowClick?.(item, index)}
                className={cn(
                  "hover:bg-muted/50 transition-colors",
                  onRowClick && "cursor-pointer",
                  rowClassName?.(item, index)
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("py-3 px-4", col.className)}>
                    {col.render(item, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Mobile Card View */}
      <div className={cn("space-y-3", breakpointClasses[mobileBreakpoint].cards)}>
        {data.map((item, index) => (
          <div
            key={keyExtractor(item, index)}
            onClick={() => onRowClick?.(item, index)}
            className={cn(
              "border rounded-lg p-4 space-y-2 bg-card",
              onRowClick && "cursor-pointer active:bg-muted/50",
              rowClassName?.(item, index)
            )}
          >
            {visibleColumns.map((col) => {
              const content = col.mobileRender
                ? col.mobileRender(item, index)
                : col.render(item, index);

              // Skip rendering if content is null/undefined
              if (content === null || content === undefined) return null;

              const label = col.mobileLabel ?? col.header;

              return (
                <div
                  key={col.key}
                  className={cn(
                    "flex items-center justify-between gap-2",
                    col.className
                  )}
                >
                  {label && (
                    <span className="text-sm text-muted-foreground flex-shrink-0">
                      {label}
                    </span>
                  )}
                  <div className="text-right">{content}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// Simpler responsive wrapper that just adds horizontal scroll
interface ResponsiveTableWrapperProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTableWrapper({ children, className }: ResponsiveTableWrapperProps) {
  return (
    <ScrollArea className={cn("w-full", className)}>
      {children}
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
