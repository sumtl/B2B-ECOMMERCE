/**
 * UI Styles - Centralized style constants for consistent design
 * Design language: Black/Gray/White with minimal red for destructive actions
 * Black: Primary actions | Gray: Secondary | Red: Destructive operations only
 */

// Layout & Page Structure
export const layoutStyles = {
  pageWrapper: "min-h-screen flex flex-col bg-white",
  pageContent: "flex-grow",
  footer: "mt-auto",
};

// Navigation
export const navbarStyles = {
  navContainer:
    "sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100",
  navContent: "max-w-6xl mx-auto px-4 h-16 flex justify-between items-center",
  logo: "text-xl font-bold tracking-tight text-gray-900 hover:opacity-70 transition-opacity",
  link: "text-sm font-medium text-gray-500 hover:text-black transition-colors",
  activeLink: "text-sm font-medium text-black",
  signInBtn:
    "bg-black text-white px-5 py-2 text-sm font-medium hover:bg-gray-800 transition-colors",
};

// Home Page
export const homePageStyles = {
  section: "max-w-6xl mx-auto px-4 py-24",
  heading: "text-3xl font-bold tracking-tight text-gray-900 mb-2",
  subHeading: "text-gray-500 mb-12 max-w-2xl",
  quickLinkCard:
    "block p-6 border border-gray-200 hover:border-black hover:bg-gray-50 transition-all duration-200 bg-white h-full",
  quickLinkTitle: "text-lg font-bold text-gray-900 mb-1",
  quickLinkSub: "text-sm text-gray-500",
};

// Footer
export const footerStyles = {
  container: "mt-auto border-t border-gray-100 bg-white py-12",
  title: "text-xl font-bold text-gray-900",
  subtitle: "text-sm text-gray-500 mt-1",
  copyright: "text-sm text-gray-500",
  tagline: "text-xs text-gray-400 mt-1",
};

// Admin Dashboard & Management Pages
export const adminStyles = {
  contentContainer: "flex-grow max-w-7xl mx-auto w-full px-4 py-8",

  // Grid layouts with proper spacing
  grid2: "grid grid-cols-1 md:grid-cols-2 gap-6",
  grid3: "grid grid-cols-1 md:grid-cols-3 gap-6",

  // Card styles with clear border and hover effect
  cardHover:
    "bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow",

  // Table container
  tableContainer: "overflow-x-auto border border-gray-200 rounded-lg",
};
