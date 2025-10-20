"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notFound, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  ArrowLeftRight, 
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  Quote
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import Image from 'next/image';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Rates', href: '/admin/rates', icon: TrendingUp },
  { name: 'Transactions', href: '/admin/transactions', icon: ArrowLeftRight },
  { name: 'Bulk Mailer', href: '/admin/bulk-mailer', icon: Mail },
  { name: 'Testimonials', href: '/admin/testimonials', icon: Quote },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, authInitialized, loading, user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  useEffect(() => {
    if (authInitialized && !loading && !isAdmin) {
      notFound();
    }
  }, [isAdmin, authInitialized, loading]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  // Show loading state while checking authentication
  if (!authInitialized || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#101d42] via-[#1a2951] to-[#0f1a3a]">
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            className="h-12 w-12 rounded-full border-4 border-white/20 border-t-[#70b340]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    );
  }

  // If not admin after initialization, notFound will be called by useEffect
  if (!isAdmin) {
    return notFound();
  }

  const userInitials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#101d42] via-[#1a2951] to-[#0f1a3a]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-white/10">
            <Link href="/" className="flex items-center gap-3">
              <motion.div 
                className="flex h-12 w-12 items-center justify-center "
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Image
                  src="/logo.png"
                  alt="Adams Pay"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </motion.div>
              <div>
                <span className="text-lg font-bold text-white">Adams Pay</span>
                <p className="text-xs text-white/60">Admin Panel</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden rounded-lg p-2 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-6 ">
            <nav className="space-y-2">
              {navigation.map((item, index) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname?.startsWith(item.href));
                
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <motion.div
                        className={`
                          flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all 
                          ${isActive 
                            ? 'bg-gradient-to-r from-[#70b340] to-[#5a9235] text-white shadow-lg shadow-[#70b340]/20' 
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }
                        `}
                        whileTap={{ scale: 0.98 }}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </ScrollArea>

          {/* User section */}
          <div className="border-t border-white/10 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
                <motion.div 
                  className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/10 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Avatar className="h-11 w-11 border-2 border-[#70b340]/50 shadow-lg">
                    <AvatarImage src={user?.profilePicture} className='object-cover' />
                    <AvatarFallback className="bg-gradient-to-br from-[#70b340] to-[#5a9235] text-white font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-white">{user?.name || 'Admin User'}</p>
                    <p className="text-xs text-white/60 truncate">{user?.email}</p>
                  </div>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-[#1a2951] border-white/20 text-white backdrop-blur-xl"
              >
                <DropdownMenuLabel className="text-white/90">Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem asChild className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                  <Link href="/">Go back to home</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                  <Link href="/settings">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  onClick={handleSignOut} 
                  className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-16 items-center gap-4 border-b border-white/10 bg-white/5 backdrop-blur-xl px-6 lg:hidden">
          <motion.button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-white/10 text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="h-6 w-6" />
          </motion.button>
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Adams Pay"
              width={28}
              height={28}
              className="w-7 h-7"
            />
            <h1 className="text-lg font-semibold text-white">Admin Panel</h1>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}