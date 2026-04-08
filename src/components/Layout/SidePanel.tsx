interface SidePanelProps {
  children: React.ReactNode;
}

export default function SidePanel({ children }: SidePanelProps) {
  return (
    <div className="w-72 flex flex-col gap-3 shrink-0">
      {children}
    </div>
  );
}
