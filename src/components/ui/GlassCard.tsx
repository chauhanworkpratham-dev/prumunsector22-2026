import React from "react";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
};

export const GlassCard: React.FC<GlassCardProps> = ({ children, className }) => {
  return (
    <div
      className={`glass-card relative overflow-hidden rounded-xl p-6 shadow-lg ${className ?? ""}`}
    >
      {children}
    </div>
  );
};
