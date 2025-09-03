import Link from "next/link";
import { AdamsLogo } from "@/components/adams-logo";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-[var(--adams-navy)] to-[var(--adams-navy)]/90">
      <main className="text-center space-y-8 max-w-md w-full">
        {/* Logo and Brand */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <AdamsLogo className="w-16 h-16 text-[var(--adams-green)]" />
            <h1 className="text-4xl font-bold text-white">Adams Pay</h1>
          </div>
          <p className="text-xl text-gray-300 font-medium">Smile. Swipe. Repeat.</p>
          <p className="text-gray-400">Fast, secure, and smart payment solutions for the modern world</p>
        </div>

        {/* Auth Navigation */}
        <div className="space-y-4 pt-8">
          <div className="space-y-3">
            <Button asChild className="w-full h-12 bg-[var(--adams-green)] hover:bg-[var(--adams-green)]/90 text-white font-semibold text-base">
              <Link href="/auth/register">
                Create Account
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
              <Link href="/auth/signin">
                Sign In
              </Link>
            </Button>
          </div>

          <div className="pt-4">
            <Link 
              href="/auth/forgot-password" 
              className="text-sm text-gray-400 hover:text-[var(--adams-green)] transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 text-xs text-gray-500 space-y-2">
          <p>© 2024 Adams Pay. All rights reserved.</p>
          <div className="space-x-4">
            <Link href="/terms" className="hover:text-[var(--adams-green)] transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-[var(--adams-green)] transition-colors">Privacy</Link>
            <Link href="/support" className="hover:text-[var(--adams-green)] transition-colors">Support</Link>
          </div>
        </div>
      </main>
    </div>
  );
}