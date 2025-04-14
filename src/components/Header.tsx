import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { ChevronDown, Menu, X } from "lucide-react";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to close mobile menu when a link is clicked
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
          <img src="/logo.png" alt="CreditEval Logo" className="h-10" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          {/* Desktop Services Dropdown */}
          <div className="relative group">
            <button className="hover:text-primary flex items-center gap-1">
              Services
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
            </button>
            {/* Dropdown Menu */}
            <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <Link
                  to="/evaluation"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  onClick={closeMobileMenu} // Close menu on click (good practice even for desktop)
                >
                  Credential Evaluations
                </Link>
                <Link
                  to="/translation"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  onClick={closeMobileMenu}
                >
                  Certified Translations
                </Link>
                <Link
                  to="/expert-opinion"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  onClick={closeMobileMenu}
                >
                  Expert Opinion Letters
                </Link>
              </div>
            </div>
          </div>
          <Link to="/about" className="hover:text-primary">
            About Us
          </Link>
          <Link to="/pricing" className="hover:text-primary">
            Pricing
          </Link>
          <Link to="/contact" className="hover:text-primary">
            Contact
          </Link>
        </nav>

        {/* Right side: Order Button and Mobile Menu Toggle */}
        <div className="flex items-center gap-2">
          {/* Start Order Button (Visible on all sizes) */}
          {/* Using Button with asChild and Link inside */}
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-xs sm:text-sm px-2 sm:px-4">
            <Link to="/order-wizard" onClick={closeMobileMenu}>Start Your Order</Link>
          </Button>

          {/* Mobile Menu Button (Visible only on mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden" // Show only on screens smaller than md
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu (Dropdown) */}
      {/* Use transition for smoother open/close */}
      <div
        className={`absolute top-16 left-0 right-0 z-40 bg-white shadow-md md:hidden transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "transform translate-y-0" : "transform -translate-y-[200%]" // Move further off-screen when hidden
        }`}
        style={{ visibility: isMobileMenuOpen ? 'visible' : 'hidden' }} // Control visibility
      >
        {/* Added check for isMobileMenuOpen before rendering nav */}
        {isMobileMenuOpen && (
          <nav className="container flex flex-col space-y-1 py-4">
            <Link to="/" className="block py-2 text-base font-medium hover:text-primary" onClick={closeMobileMenu}>
              Home
            </Link>
            {/* Mobile Services Links */}
            <span className="pt-3 pb-1 text-sm font-semibold text-muted-foreground uppercase">Services</span>
            <Link
              to="/evaluation"
              className="block py-2 pl-4 text-base text-gray-700 hover:text-primary"
              onClick={closeMobileMenu}
            >
              Credential Evaluations
            </Link>
            <Link
              to="/translation"
              className="block py-2 pl-4 text-base text-gray-700 hover:text-primary"
              onClick={closeMobileMenu}
            >
              Certified Translations
            </Link>
            <Link
              to="/expert-opinion"
              className="block py-2 pl-4 text-base text-gray-700 hover:text-primary"
              onClick={closeMobileMenu}
            >
              Expert Opinion Letters
            </Link>
            <span className="pt-3 pb-1 text-sm font-semibold text-muted-foreground uppercase">Company</span>
            <Link
              to="/about"
              className="block py-2 text-base font-medium hover:text-primary"
              onClick={closeMobileMenu}
            >
              About Us
            </Link>
            <Link
              to="/pricing"
              className="block py-2 text-base font-medium hover:text-primary"
              onClick={closeMobileMenu}
            >
              Pricing
            </Link>
            <Link
              to="/contact"
              className="block py-2 text-base font-medium hover:text-primary"
              onClick={closeMobileMenu}
            >
              Contact
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
