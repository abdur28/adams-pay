import { FloatingNavbar } from "@/components/floating-navbar"

export default function HomePage() {
  // For demo purposes, let's assume user is signed in
  const isSignedIn = true

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#101d42] via-[#1a2951] to-[#0f1a3a]">
      <FloatingNavbar isSignedIn={isSignedIn} />

      <main className="pt-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Welcome to <span className="text-[#70b340]">Adams Pay</span>
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Fast, secure, and reliable money transfers across the globe. Experience the future of digital payments.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/transfer"
              className="bg-[#70b340] hover:bg-[#5a9235] text-white px-8 py-4 rounded-full font-semibold transition-colors duration-200"
            >
              Start Transfer
            </a>
            <a
              href="/transactions"
              className="border border-white/20 text-white hover:bg-white/10 px-8 py-4 rounded-full font-semibold transition-colors duration-200"
            >
              View Transactions
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
