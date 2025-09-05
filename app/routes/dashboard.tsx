import { Outlet, Link, useLocation, Form, useLoaderData, redirect } from "react-router";
import type { Route } from "./+types/dashboard";
import { 
  Phone, 
  LayoutDashboard, 
  PhoneCall, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
  ChevronDown,
  Users,
  Calendar,
  Shield,
  UserCircle,
  Database
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSession, destroySession } from "~/lib/session.server";
import { cn } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  
  if (!session.has("userId")) {
    return redirect("/login");
  }
  
  return {
    user: {
      email: session.get("email"),
      role: session.get("role"),
      companyId: session.get("companyId")
    }
  };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request);
  
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export default function DashboardLayout() {
  const { user } = useLoaderData<typeof loader>();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contactsExpanded, setContactsExpanded] = useState(
    location.pathname.includes('/contacts') || location.pathname.includes('/internal-contacts')
  );

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard, shortcut: "O" },
    { name: "Calls", href: "/dashboard/calls", icon: PhoneCall, shortcut: "C" },
    { name: "Data Collection", href: "/dashboard/data-collection", icon: Database, shortcut: "D" },
    { name: "Callbacks", href: "/dashboard/callbacks", icon: Calendar, shortcut: "B" },
    { 
      name: "Contacts", 
      icon: Users, 
      shortcut: "U",
      submenu: [
        { name: "All Contacts", href: "/dashboard/contacts", icon: Users },
        { name: "Internal", href: "/dashboard/internal-contacts", icon: Shield }
      ]
    },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, shortcut: "A" },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, shortcut: "S" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20"
              onClick={() => setSidebarOpen(false)} 
            />
            
            <motion.div 
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="relative flex w-56 flex-col bg-white/95 backdrop-blur-xl border-r border-gray-200/50"
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
                  <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">VoiceAI</span>
                </div>
                
                <nav className="flex-1 px-2 py-2">
                  {navigation.map((item, index) => {
                    if (item.submenu) {
                      const isSubmenuActive = item.submenu.some(sub => isActive(sub.href));
                      return (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <button
                            onClick={() => setContactsExpanded(!contactsExpanded)}
                            className={cn(
                              "group flex items-center gap-2 px-2.5 py-2 mb-0.5 rounded-md transition-all duration-200 w-full",
                              isSubmenuActive 
                                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20" 
                                : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                            )}
                          >
                            <item.icon className={cn(
                              "h-4 w-4 transition-transform",
                              isSubmenuActive && "scale-110"
                            )} />
                            <span className="text-xs font-medium flex-1 text-left">{item.name}</span>
                            <ChevronDown className={cn(
                              "h-3 w-3 transition-transform",
                              contactsExpanded && "rotate-180"
                            )} />
                          </button>
                          <AnimatePresence>
                            {contactsExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                {item.submenu.map((subItem, subIndex) => {
                                  const subActive = isActive(subItem.href);
                                  return (
                                    <motion.div
                                      key={subItem.name}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: subIndex * 0.05 }}
                                    >
                                      <Link
                                        to={subItem.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={cn(
                                          "group flex items-center gap-2 px-2.5 py-2 mb-0.5 ml-6 rounded-md transition-all duration-200",
                                          subActive 
                                            ? "bg-indigo-100 text-indigo-700" 
                                            : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                                        )}
                                      >
                                        <subItem.icon className="h-3.5 w-3.5" />
                                        <span className="text-xs font-medium">{subItem.name}</span>
                                      </Link>
                                    </motion.div>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    }
                    
                    const active = isActive(item.href);
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "group flex items-center gap-2 px-2.5 py-2 mb-0.5 rounded-md transition-all duration-200",
                            active 
                              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20" 
                              : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                          )}
                        >
                          <item.icon className={cn(
                            "h-4 w-4 transition-transform",
                            active && "scale-110"
                          )} />
                          <span className="text-xs font-medium flex-1">{item.name}</span>
                          <span className={cn(
                            "text-[10px] opacity-0 group-hover:opacity-100 transition-opacity",
                            active ? "text-white/80" : "text-gray-400"
                          )}>
                            ⌘{item.shortcut}
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>
                
                <div className="p-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-gray-900 truncate">{user.email.split('@')[0]}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user.role || 'Admin'}</p>
                    </div>
                  </div>
                  <Form method="post">
                    <button type="submit" className="flex items-center gap-2 w-full px-2 py-1.5 text-gray-600 rounded-md hover:bg-red-50 hover:text-red-600 transition-all group">
                      <LogOut className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-medium">Sign Out</span>
                    </button>
                  </Form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-56">
        <div className="flex flex-col flex-1 bg-white/80 backdrop-blur-xl border-r border-gray-200/50">
          <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
            <motion.div 
              className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Phone className="h-4 w-4 text-white" />
            </motion.div>
            <span className="text-sm font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">VoiceAI</span>
          </div>
          
          <nav className="flex-1 px-2 py-2">
            {navigation.map((item, index) => {
              if (item.submenu) {
                const isSubmenuActive = item.submenu.some(sub => isActive(sub.href));
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => setContactsExpanded(!contactsExpanded)}
                      className={cn(
                        "group flex items-center gap-2 px-2.5 py-2 mb-0.5 rounded-md transition-all duration-200 w-full relative",
                        isSubmenuActive 
                          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20" 
                          : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                      )}
                    >
                      <item.icon className={cn(
                        "h-4 w-4 transition-transform",
                        isSubmenuActive && "scale-110"
                      )} />
                      <span className="text-xs font-medium flex-1 text-left">{item.name}</span>
                      <ChevronDown className={cn(
                        "h-3 w-3 transition-transform",
                        contactsExpanded && "rotate-180"
                      )} />
                    </button>
                    <AnimatePresence>
                      {contactsExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {item.submenu.map((subItem, subIndex) => {
                            const subActive = isActive(subItem.href);
                            return (
                              <motion.div
                                key={subItem.name}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: subIndex * 0.05 }}
                                whileHover={{ x: 2 }}
                              >
                                <Link
                                  to={subItem.href}
                                  className={cn(
                                    "group flex items-center gap-2 px-2.5 py-2 mb-0.5 ml-6 rounded-md transition-all duration-200",
                                    subActive 
                                      ? "bg-indigo-100 text-indigo-700" 
                                      : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                                  )}
                                >
                                  <subItem.icon className="h-3.5 w-3.5" />
                                  <span className="text-xs font-medium">{subItem.name}</span>
                                </Link>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              }
              
              const active = isActive(item.href);
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 2 }}
                >
                  <Link
                    to={item.href}
                    className={cn(
                      "group flex items-center gap-2 px-2.5 py-2 mb-0.5 rounded-md transition-all duration-200 relative",
                      active 
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20" 
                        : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                    )}
                  >
                    {active && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-md -z-10"
                        layoutId="activeNav"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <item.icon className={cn(
                      "h-4 w-4 transition-transform",
                      active && "scale-110"
                    )} />
                    <span className="text-xs font-medium flex-1">{item.name}</span>
                    <span className={cn(
                      "text-[10px] opacity-0 group-hover:opacity-100 transition-opacity",
                      active ? "text-white/80" : "text-gray-400"
                    )}>
                      ⌘{item.shortcut}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>
          
          <div className="p-2 border-t border-gray-100">
            <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
              <motion.div 
                className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500"
                whileHover={{ scale: 1.1 }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-gray-900 truncate">{user.email.split('@')[0]}</p>
                <p className="text-[10px] text-gray-500 truncate">{user.role || 'Admin'}</p>
              </div>
            </div>
            <Form method="post">
              <motion.button 
                type="submit" 
                className="flex items-center gap-2 w-full px-2 py-1.5 text-gray-600 rounded-md hover:bg-red-50 hover:text-red-600 transition-all group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Sign Out</span>
              </motion.button>
            </Form>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:pl-56">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-gray-200/50">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-4 w-4 text-gray-600" />
              </button>
              
              <div className="flex-1" />
              
              <motion.button 
                className="relative p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="h-4 w-4" />
                <motion.span 
                  className="absolute top-1 right-1 h-1.5 w-1.5 bg-red-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </motion.button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}