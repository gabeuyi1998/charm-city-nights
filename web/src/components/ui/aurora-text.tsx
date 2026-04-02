"use client";
import { cn } from "@/lib/utils";

interface AuroraTextProps {
  className?: string;
  children: React.ReactNode;
  colors?: string[];
}

export function AuroraText({
  className,
  children,
  colors = ["#FF5C00", "#E9C349", "#FFB59A", "#FF5C00"],
}: AuroraTextProps) {
  const gradient = `linear-gradient(135deg, ${colors.join(", ")})`;
  return (
    <>
      <style>{`
        @keyframes aurora-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .aurora-text {
          background-image: ${gradient};
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: aurora-shift 4s ease infinite;
        }
      `}</style>
      <span className={cn("aurora-text", className)}>{children}</span>
    </>
  );
}
