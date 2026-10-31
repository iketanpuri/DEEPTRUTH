'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { label: 'Verify', href: '/verify' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'History', href: '/history' },
  { label: 'Demo', href: '/demo' },
  { label: 'Technology', href: '/technology' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
      // Focus the close button when menu opens
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [mobileMenuOpen]);

  // Keyboard handling: Escape to close, focus trap
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!mobileMenuOpen) return;

    if (e.key === 'Escape') {
      setMobileMenuOpen(false);
      openButtonRef.current?.focus();
      return;
    }

    // Focus trap
    if (e.key === 'Tab' && menuRef.current) {
      const focusable = menuRef.current.querySelectorAll<HTMLElement>(
        'a[href], button, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-background/80 backdrop-blur-md border-b border-border/50 py-2 sm:py-3' : 'bg-transparent py-3 sm:py-5'
        }`}
        style={{ paddingTop: `max(${isScrolled ? '0.5rem' : '0.75rem'}, env(safe-area-inset-top))` }}
      >
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group touch-target">
            <style>{`
              @keyframes custom-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
              .animate-custom-blink { animation: custom-blink 1s step-end infinite; }
            `}</style>
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#F4B740] to-[#FF5470] relative flex-shrink-0 flex items-center justify-center">
              <span className="font-bold text-sm text-[#1E1C28] leading-none" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>D</span>
            </div>
            <div className="font-bold text-[18px] tracking-[0.2px] flex items-center text-white" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
              DeepTruth<span className="text-[#F4B740] ml-[2px] animate-custom-blink">_</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-white py-2 ${
                  pathname === link.href ? 'text-white' : 'text-foreground/70'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA & Mobile Toggle */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/verify"
              className="hidden md:inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              Start Verification
            </Link>
            <button
              ref={openButtonRef}
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2.5 text-foreground/80 hover:text-white transition-colors touch-target flex items-center justify-center"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Full-Screen Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            ref={menuRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-background/98 backdrop-blur-xl flex flex-col"
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
              paddingLeft: 'env(safe-area-inset-left)',
              paddingRight: 'env(safe-area-inset-right)',
            }}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 sm:p-6">
              <Link href="/" className="flex items-center gap-2 touch-target" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#F4B740] to-[#FF5470] relative flex-shrink-0 flex items-center justify-center">
                  <span className="font-bold text-sm text-[#1E1C28] leading-none" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>D</span>
                </div>
                <div className="font-bold text-[18px] tracking-[0.2px] flex items-center text-white" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                  DeepTruth<span className="text-[#F4B740] ml-[2px] animate-custom-blink">_</span>
                </div>
              </Link>
              <button
                ref={closeButtonRef}
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 text-foreground/80 hover:text-white transition-colors touch-target flex items-center justify-center rounded-lg hover:bg-surface"
                aria-label="Close navigation menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Menu Links */}
            <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6">
              {[...NAV_LINKS, { label: 'About', href: '/about' }].map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 + 0.1 }}
                  className="w-full max-w-sm"
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-center w-full py-4 text-xl font-medium transition-colors rounded-xl touch-target ${
                      pathname === link.href
                        ? 'text-white bg-surface/50'
                        : 'text-foreground/70 hover:text-white hover:bg-surface/30'
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-sm mt-6"
              >
                <Link
                  href="/verify"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center px-6 py-4 text-base font-medium bg-white text-black rounded-xl hover:bg-gray-200 transition-colors touch-target"
                >
                  Start Verification
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
