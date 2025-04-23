// src/components/SolutionsDropdown.tsx

import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover"; // Corrected import path
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react"; // Import the icon

export function SolutionsDropdown() {
  return (
    <Popover>
      {/* Add flex, items-center, gap-1 and group class */}
      <PopoverTrigger className="group flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-600 data-[state=open]:text-blue-600">
        Services
        {/* Add icon and rotation based on group's open state */}
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </PopoverTrigger>
      {/* Changed grid-cols-3 to grid-cols-2 */}
      <PopoverContent className="w-[480px] p-6 grid grid-cols-2 gap-8 shadow-xl border rounded-2xl z-50 bg-white">

        {/* Column 1: Services */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-500">Our Services</h4>
          <ul className="space-y-2">
            <li>
              {/* TODO: Ensure '/translation' route exists or update */}
              <Link to="/translation" className="hover:text-blue-600 flex items-center gap-2">
                📄 Certified Translations
              </Link>
            </li>
            <li>
              {/* TODO: Ensure '/evaluation' route exists or update */}
              <Link to="/evaluation" className="hover:text-blue-600 flex items-center gap-2">
                🎓 Credential Evaluations
              </Link>
            </li>
            <li>
              {/* TODO: Ensure '/expert-opinion' route exists or update */}
              <Link to="/expert-opinion" className="hover:text-blue-600 flex items-center gap-2">
                📝 Expert Opinion Letters
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 2: Use Cases */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-500">Use Cases</h4>
          <ul className="space-y-2">
            <li><Link to="/use-cases/immigration" className="hover:text-blue-600">🛂 USCIS Immigration</Link></li>
            <li><Link to="/use-cases/academic" className="hover:text-blue-600">🏫 Academic Admissions</Link></li>
            <li><Link to="/use-cases/employment" className="hover:text-blue-600">💼 Employment Visas</Link></li>
            {/* Restore Link */}
            <li className="mt-2 text-sm text-blue-600 hover:underline">
              <Link to="/use-cases">See all examples →</Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Integrations REMOVED */}

      </PopoverContent>
    </Popover>
  );
}
