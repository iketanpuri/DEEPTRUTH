import Link from 'next/link';
import { Fingerprint } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-background pt-12 sm:pt-16 pb-8 mt-auto safe-bottom">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-12">
          {/* Brand */}
          <div className="sm:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 touch-target w-fit">
              <div className="bg-accent/10 p-1.5 rounded-lg border border-accent/20">
                <Fingerprint className="w-5 h-5 text-accent" />
              </div>
              <span className="font-bold tracking-widest text-lg">CLARIFAKE</span>
            </Link>
            <p className="text-foreground/60 text-sm max-w-sm font-medium mb-4 sm:mb-6">
              Know what&apos;s real. Before it spreads.
            </p>
            <p className="text-foreground/40 text-sm max-w-sm">
              Built for a safer and more trustworthy digital world.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4">Product</h4>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <Link href="/verify" className="text-sm text-foreground/60 hover:text-white transition-colors inline-flex items-center py-2 touch-target">
                  Verify Content
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-sm text-foreground/60 hover:text-white transition-colors inline-flex items-center py-2 touch-target">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/technology" className="text-sm text-foreground/60 hover:text-white transition-colors inline-flex items-center py-2 touch-target">
                  Technology
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4">Company</h4>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <Link href="/about" className="text-sm text-foreground/60 hover:text-white transition-colors inline-flex items-center py-2 touch-target">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-foreground/60 hover:text-white transition-colors inline-flex items-center py-2 touch-target">
                  Privacy
                </Link>
              </li>
              <li className="flex gap-4 pt-3 sm:pt-4">
                <a href="#" className="text-xs font-semibold tracking-wider text-foreground/40 hover:text-white transition-colors py-2 touch-target">TWITTER</a>
                <a href="#" className="text-xs font-semibold tracking-wider text-foreground/40 hover:text-white transition-colors py-2 touch-target">GITHUB</a>
                <a href="#" className="text-xs font-semibold tracking-wider text-foreground/40 hover:text-white transition-colors py-2 touch-target">LINKEDIN</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-foreground/40 text-center sm:text-left">
            &copy; {new Date().getFullYear()} Clarifake. All rights reserved. (Demo Prototype)
          </p>
          <div className="flex gap-4 text-xs text-foreground/40">
            <Link href="/privacy" className="hover:text-white transition-colors py-2 touch-target">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors py-2 touch-target">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
