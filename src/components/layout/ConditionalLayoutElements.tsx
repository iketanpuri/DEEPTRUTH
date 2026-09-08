"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BackgroundMotion } from "@/components/animations/BackgroundMotion";
import InitialSplash from "@/components/animations/InitialSplash";

export function ConditionalLayoutElements({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname === "/") {
    return <main className="flex-1 w-full overflow-x-hidden">{children}</main>;
  }

  return (
    <>
      <InitialSplash />
      <BackgroundMotion />
      <Navbar />
      <main className="flex-1 w-full overflow-x-hidden">
        {children}
      </main>
      <Footer />
    </>
  );
}
