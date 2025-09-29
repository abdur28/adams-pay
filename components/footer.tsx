import { CheckCircle, Shield } from "lucide-react"
import { AdamsLogo } from "./adams-logo"

const Footer = () => {
    return (
              <footer className="py-16 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <AdamsLogo className="w-8 h-8 text-[#70b340]" />
                <span className="text-xl font-bold text-white">Adams Pay</span>
              </div>
              <p className="text-white/70 mb-6">
                Fast, secure, and reliable money transfers across the globe. Experience the future of digital payments.
              </p>
              <div className="text-white/60 text-sm">© 2025 Adams Pay. All rights reserved.</div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Money Transfer
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Currency Exchange
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Business Solutions
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    API Integration
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Press
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Partners
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-white/60 text-sm">Licensed and regulated by financial authorities worldwide</div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-[#70b340]">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Secure & Encrypted</span>
                </div>
                <div className="flex items-center gap-2 text-[#70b340]">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Fully Licensed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    )
}

export default Footer