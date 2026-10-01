import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ToolTab = "synonyms" | "versions" | "reviews";

type Props = {
  docked: boolean;
  open: boolean;
  tab: ToolTab;
  onOpenChange(open: boolean): void;
  onTabChange(tab: ToolTab): void;
  tabs: { value: ToolTab; label: string; content: ReactNode }[];
};

const isToolTab = (value: string): value is ToolTab =>
  value === "synonyms" || value === "versions" || value === "reviews";

function PanelTabs({ tab, onTabChange, tabs }: Omit<Props, "docked" | "open" | "onOpenChange">) {
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

export function ToolsPanel({ docked, open, onOpenChange, ...tabsProps }: Props) {
  if (docked) {
    return open ? (
      <aside className="flex w-80 shrink-0 flex-col border-l bg-sidebar p-4 text-sidebar-foreground">
        <PanelTabs {...tabsProps} />
      </aside>
    ) : null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 p-4 pt-12">
        <SheetHeader className="sr-only">
          <SheetTitle>Outils</SheetTitle>
        </SheetHeader>
        <PanelTabs {...tabsProps} />
      </SheetContent>
    </Sheet>
  );
}
