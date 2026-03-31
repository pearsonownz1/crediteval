import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

export function SolutionsDropdown() {
  return (
    <Popover>
      <PopoverTrigger className="group flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-600 data-[state=open]:text-blue-600">
        Services
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </PopoverTrigger>
      <PopoverContent className="w-[480px] p-6 grid grid-cols-2 gap-8 shadow-xl border rounded-2xl z-50 bg-white">
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-500">Our Services</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/translation" className="hover:text-blue-600 flex items-center gap-2">
                📄 Certified Translations
              </Link>
            </li>
            <li>
              <Link to="/evaluation" className="hover:text-blue-600 flex items-center gap-2">
                🎓 Credential Evaluations
              </Link>
            </li>
            <li>
              <Link to="/expert-opinion" className="hover:text-blue-600 flex items-center gap-2">
                📝 Expert Opinion Letters
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-500">Use Cases</h4>
          <ul className="space-y-2">
            <li><Link to="/use-cases/immigration" className="hover:text-blue-600">🛂 USCIS Immigration</Link></li>
            <li><Link to="/use-cases/academic" className="hover:text-blue-600">🏫 Academic Admissions</Link></li>
            <li><Link to="/use-cases/employment" className="hover:text-blue-600">💼 Employment Visas</Link></li>
            <li className="mt-2 text-sm text-blue-600 hover:underline">
              <Link to="/use-cases">See all examples →</Link>
            </li>
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
