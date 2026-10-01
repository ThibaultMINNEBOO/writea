import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";

export type ToolTab = "synonyms" | "versions" | "reviews";

type Props = {
  open: boolean;
  tab: ToolTab;
  onOpenChange(open: boolean): void;
  onTabChange(tab: ToolTab): void;
  tabs: { value: ToolTab; label: string; content: ReactNode }[];
};

const isToolTab = (value: string): value is ToolTab =>
  value === "synonyms" || value === "versions" || value === "reviews";

function PanelTabs({ tab, onTabChange, tabs }: Omit<Props, "open" | "onOpenChange">) {
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => isToolTab(value) && onTabChange(value)}
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <TabsList className="w-full">
        {tabs.map(({ value, label }) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map(({ value, content }) => (
        <TabsContent key={value} value={value} className="flex min-h-0 flex-col">
          {content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function ToolsPanel({ open, onOpenChange, ...tabsProps }: Props) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (isDesktop) {
    return open ? (
      <aside className="flex w-80 shrink-0 flex-col border-l bg-sidebar p-4 text-sidebar-foreground">
        <PanelTabs {...tabsProps} />
      </aside>
    ) : null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 p-4">
        <SheetHeader className="sr-only">
          <SheetTitle>Outils</SheetTitle>
        </SheetHeader>
        <PanelTabs {...tabsProps} />
      </SheetContent>
    </Sheet>
  );
}
