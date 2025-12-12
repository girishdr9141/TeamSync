// src/components/ui/sidebar.jsx

import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

const SidebarContext = createContext(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({ children, open, setOpen, animate }) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
};

export const DesktopSidebar = ({ className, children, ...props }) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        // FIXED: Background White, Border Light Gray
        "h-full px-4 py-4 hidden md:flex md:flex-col bg-white w-[300px] flex-shrink-0 border-r border-slate-200",
        className
      )}
      animate={{
        width: animate ? (open ? "300px" : "80px") : "300px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({ className, children, ...props }) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          // FIXED: Background White, Border Light Gray
          "h-16 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-white border-b border-slate-200 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-slate-700 cursor-pointer" // Dark Icon
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                // FIXED: Mobile Menu White
                "fixed h-full w-full inset-0 bg-white p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-slate-700 cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <X />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({ link, className, ...props }) => {
  const { open, animate } = useSidebar();
  const location = useLocation();
  const isActive = location.pathname === link.href;

  return (
    <Link
      to={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2",
        // FIXED: Text Colors (Slate-600 for inactive, Indigo-600 for active)
        isActive ? "text-indigo-600 font-semibold" : "text-slate-600 hover:text-slate-900",
        className
      )}
      {...props}
    >
      <div className={cn("flex items-center justify-center", isActive && "text-indigo-600")}>
          {link.icon}
      </div>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          "text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0",
           // FIXED: Ensure text is dark
          isActive ? "text-indigo-600 font-medium" : "text-slate-600 group-hover:text-slate-900"
        )}
      >
        {link.label}
      </motion.span>
    </Link>
    
  );
};

export const SidebarButton = ({
  onClick,
  icon,
  label,
  className,
}) => {
  const { open, animate } = useSidebar();
  
  return (
    <button
      onClick={onClick}
      className={cn(
        // FIXED: Hover color light gray
        "flex items-center justify-start gap-2 group/sidebar py-2 w-full bg-transparent border-0 cursor-pointer hover:bg-slate-100 rounded-md transition-colors",
        className
      )}
    >
      <div className="flex items-center justify-center text-slate-500 group-hover:text-red-600">
        {icon}
      </div>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        // FIXED: Text color
        className="text-slate-600 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0 group-hover:text-red-600"
      >
        {label}
      </motion.span>
    </button>
  );
};