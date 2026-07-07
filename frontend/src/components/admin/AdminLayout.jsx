import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const navItems = [
  {
    path: "/admin",
    label: "Dashboard",
    icon: "fa-solid fa-chart-pie",
  },
  {
    path: "/admin/locations",
    label: "Locations",
    icon: "fa-solid fa-location-dot",
  },
  {
    path: "/admin/homepage",
    label: "Home page",
    icon: "fa-solid fa-globe",
  },
  {
    path: "/admin/about",
    label: "About page",
    icon: "fa-solid fa-circle-info",
  },
  {
    path: "/admin/academy",
    label: "Academy page",
    icon: "fa-solid fa-graduation-cap",
  },
  {
    path: "/admin/portfolio",
    label: "Portfolio page",
    icon: "fa-solid fa-folder-open",
  },
];

function isActive(item, pathname) {
  if (item.path === "/admin") return pathname === "/admin"
  return pathname === item.path || pathname.startsWith(item.path + "/")
}

function matchHeader(item, pathname) {
  if (item.path === "/") return false
  if (item.path === "/admin") return pathname === "/admin"
  return pathname.startsWith(item.path)
}

function DarkModeToggle() {
  const { dark, toggle } = useTheme()
  return (
    <button onClick={toggle} title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-[#1e2d3d] hover:bg-gray-100 dark:hover:bg-[#2a3d4d] border-0 text-navy dark:text-white/70 hover:text-navy dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors duration-200 text-lg">
      {dark ? <i className="fa-solid fa-sun" /> : <i className="fa-solid fa-moon" />}
    </button>
  )
}

export default function AdminLayout({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0A1216]" dir="ltr">
      {/* ─── Sidebar Overlay (Mobile Only) ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`w-[260px] bg-white dark:bg-[#15202b] border-r border-border dark:border-[#1e2d3d] flex flex-col shrink-0 fixed left-0 h-full z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-sm ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo / Brand */}
        <div className="px-6 pt-6 pb-5 border-b border-border dark:border-[#1e2d3d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigate("/admin");
                closeSidebar();
              }}
              className="bg-transparent border-0 cursor-pointer p-0"
            >
              <img
                src="/images/logo.png"
                alt="Setup Studio"
                className="w-16 h-auto"
              />
            </button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-gray-100 dark:bg-[#1e2d3d] hover:bg-gray-200 dark:hover:bg-[#2a3d4d] text-muted dark:text-white/50 hover:text-navy dark:hover:text-white flex items-center justify-center transition-all duration-200 no-underline"
              title="View public site"
            >
              <i className="fa-solid fa-house text-[11px]" />
            </a>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1e2d3d] border-0 text-muted dark:text-white/50 hover:text-navy dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors duration-200"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 px-4 flex flex-col gap-1.5">
          {navItems.map((item) => {
            const active = isActive(item, pathname)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 no-underline ${
                  active
                    ? "text-white bg-red shadow-lg shadow-red/20 font-semibold"
                    : "text-muted dark:text-white/50 hover:text-navy dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1e2d3d]"
                }`}
              >
                <i className={`${item.icon} w-5 text-center text-base`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border dark:border-[#1e2d3d]">
          <button
            onClick={() => {
              signOut();
              navigate("/admin/login");
            }}
            className="w-full flex items-center justify-center gap-3 text-muted dark:text-white/50 hover:text-navy dark:hover:text-white bg-gray-50 dark:bg-[#1e2d3d] hover:bg-gray-100 dark:hover:bg-[#2a3d4d] py-3.5 rounded-xl text-sm font-medium transition-all duration-200 border-0 cursor-pointer"
          >
            <i className="fa-solid fa-arrow-right-from-bracket" />
            Logout
          </button>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <div className="flex-1 min-h-screen flex flex-col lg:pl-[260px]">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-[#15202b] border-b border-border dark:border-[#1e2d3d] flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {/* Hamburger (Mobile Only) */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden w-10 h-10 rounded-xl bg-gray-50 dark:bg-[#1e2d3d] hover:bg-gray-100 dark:hover:bg-[#2a3d4d] border-0 text-navy dark:text-white flex items-center justify-center cursor-pointer transition-colors duration-200"
            >
              <i className="fa-solid fa-bars text-lg" />
            </button>
            <h2 className="text-navy dark:text-white font-bold text-lg m-0 tracking-tight">
              {navItems.find((n) => matchHeader(n, pathname))?.label || "Admin Panel"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <span className="w-[1.5px] h-6 bg-border dark:bg-[#1e2d3d]" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-navy/10 dark:bg-white/10 flex items-center justify-center text-navy dark:text-white font-bold text-xs">
                {user?.email ? (user.email.split("@")[0].slice(0, 2).toUpperCase()) : "AD"}
              </div>
              <span className="hidden sm:inline text-navy dark:text-white font-semibold text-xs">
                {user?.email || "Administrator"}
              </span>
            </div>
          </div>
        </header>

        {/* Font Awesome CDN for sun/moon icons (already loaded globally) */}
        <main className="p-6 sm:p-8 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
