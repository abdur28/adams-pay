import { FloatingNavbar } from "@/components/floating-navbar"
import { Transfer } from "@/components/Transfer"

export default function TransferPage() {
  const isSignedIn = true

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#101d42] via-[#1a2951] to-[#0f1a3a]">
      <FloatingNavbar />

      <main className="pt-32 px-4 pb-12 ">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Send Money Worldwide</h1>
            <p className="text-white/80 text-lg">Fast, secure transfers with competitive exchange rates</p>
          </div>

          <Transfer />
        </div>
      </main>
    </div>
  )
}
