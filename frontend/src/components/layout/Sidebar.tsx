import React from 'react';

// In a real app, you would pass filter props and callbacks here
interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  return (
    <div className={`space-y-8 ${className}`}>
      
      {/* Categories Filter */}
      <div>
        <h3 className="font-bold text-gray-900 mb-4">Categories</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2">Screens & Displays</span>
            </label>
          </li>
          <li>
             <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2">Batteries</span>
            </label>
          </li>
          <li>
             <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2">Charging Ports</span>
            </label>
          </li>
        </ul>
      </div>

      {/* Price Filter */}
      <div>
        <h3 className="font-bold text-gray-900 mb-4">Price Range</h3>
        <div className="flex items-center space-x-2">
           <input type="number" placeholder="Min" className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
           <span className="text-gray-400">-</span>
           <input type="number" placeholder="Max" className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
        </div>
      </div>

    </div>
  );
};

export default Sidebar;