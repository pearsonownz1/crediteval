import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react"; // Removed ChevronDown
import { SolutionsDropdown } from "./SolutionsDropdown"; // Import the new dropdown

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
          <img src="/logo4.png" alt="CreditEval Logo" className="h-32" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {/* Home link removed */}
          {/* Replace old dropdown with new component */}
          <SolutionsDropdown />
          <Link to="/about" className="hover:text-primary">
            About Us
          </Link>
          <Link to="/pricing" className="hover:text-primary">
            Pricing
          </Link>
          <Link to="/contact" className="hover:text-primary">
            Contact
          </Link>
          <Link to="/faq" className="hover:text-primary">
            FAQ
          </Link>
        </nav>

        {/* Right side Buttons & Mobile Menu Toggle */}
        <div className="flex items-center gap-2">
          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-2">
             <Button asChild variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">
               <Link to="/quote" onClick={closeMobileMenu}>Get a Quote</Link>
             </Button>
             <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-xs sm:text-sm px-2 sm:px-4">
               <Link to="/order" onClick={closeMobileMenu}>Order Now</Link>
             </Button>
          </div>
           {/* Mobile Order Button Removed */}

          {/* Mobile Menu Toggle */}
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
            <Link
              to="/faq"
              className="block py-2 text-base font-medium hover:text-primary"
              onClick={closeMobileMenu}
            >
              FAQ
            </Link>

            {/* Mobile Menu Bottom Buttons */}
            <div className="pt-6 mt-4 border-t border-gray-200 space-y-2">
               {/* Login Button Removed */}
               <div className="flex gap-2">
                 <Button asChild variant="outline" className="w-1/2">
                   <Link to="/quote" onClick={closeMobileMenu}>Get a Quote</Link>
                 </Button>
                 <Button asChild className="w-1/2 bg-primary hover:bg-primary/90">
                   <Link to="/order" onClick={closeMobileMenu}>Order Now</Link>
                 </Button>
               </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
