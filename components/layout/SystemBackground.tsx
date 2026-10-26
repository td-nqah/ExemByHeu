"use client";

export function SystemBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070712]">
      {/* Unified ambient background: Clean, elegant dark lighting (no starry sky, no meteors) */}
      <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 h-[650px] w-[1100px] rounded-full bg-gradient-to-b from-[#4f46e5]/12 via-[#3730a3]/5 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-[35%] -left-[10%] h-[550px] w-[550px] rounded-full bg-[#4338ca]/5 blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-[15%] right-[5%] h-[650px] w-[650px] rounded-full bg-[#312e81]/8 blur-[160px] pointer-events-none" />
    </div>
  );
}
