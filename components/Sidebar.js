'use client'

import { useState } from 'react';
import Link from 'next/link';

// Component for a single dropdown item
const DropdownItem = ({ title, links, isOpen, isMainOpen, isActive, onClick }) => {
  return (
    <div className="mb-2">
      <button
        onClick={onClick}
        className="flex items-center w-full p-2 rounded hover:bg-gray-700 focus:outline-none"
      >
        <span className="mr-3">
          {isActive ? '▼' : '▶'}
        </span>
        <span className={`transition-opacity duration-300 ${isMainOpen ? 'opacity-100' : 'opacity-0'}`}>
          {title}
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}
      >
        <ul className="pl-6">
          {links.map((link) => (
            <li key={link.href} className="mb-1">
              <Link href={link.href} className="flex items-center p-2 rounded hover:bg-gray-600">
                <span className={`transition-opacity duration-300 ${isMainOpen ? 'opacity-100' : 'opacity-0'}`}>
                  {link.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleDropdownToggle = (title) => {
    setOpenDropdown(openDropdown === title ? null : title);
  };

  const menuItems = [
    {
      title: 'Admin',
      links: [
        { href: '/admin/floor', label: 'Floor' },
        { href: '/admin/floor-lines', label: 'Floor Lines' },
        { href: '/admin/hours', label: 'Hours' },
        { href: '/admin/hourly-production-entry', label: 'Hourly Production Entry' },
        { href: '/admin/machine-types', label: 'Machine Types' },
        { href: '/admin/machines', label: 'Machines' },
        { href: '/admin/operators', label: 'Operators' },
        { href: '/admin/operators/update', label: 'Operator update' },
        { href: '/admin/supervisors', label: 'Supervisor' },
      ],
    },
    {
      title: 'Supervisor',
      links: [
        { href: '/supervisor/processes', label: 'Processes' },
        { href: '/supervisor/daily-production', label: 'Daily Production' },
      ],
    },
    {
      title: 'Reports',
      links: [
        { href: '/reports/date-range-operator-search', label: 'Date Range Operator Search' },
        { href: '/reports/floor-line-wise-report', label: 'Floor Line Wise Report' },
        { href: '/reports/line-report', label: 'Line Report' },
        { href: '/reports/machine-report', label: 'Machine Report' },
        { href: '/reports/search-by-process', label: 'Search by Process' },
        { href: '/reports/breakdown-check', label: 'breakdown check' },
        { href: '/reports/breackdown-check-1', label: 'breackdown-check-1' },
      ],
    },
  ];

  return (
    <div
      className={`bg-gray-800 text-white p-4 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      } flex flex-col min-h-screen`}
    >
      {/* Toggle button */}
      <div className="flex justify-end mb-4">
        <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none">
          {isOpen ? 'Close' : 'Open'}
        </button>
      </div>

      {/* Sidebar content */}
      <nav className="flex-1">
        <ul>
          {/* Static links */}
          <li className="mb-2">
            <Link href="/" className="flex items-center p-2 rounded hover:bg-gray-700">
              <span className="mr-3">🏠</span>
              <span className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>Dashboard</span>
            </Link>
          </li>
          

          {/* Dynamically generated dropdowns */}
          {menuItems.map((item) => (
            <DropdownItem
              key={item.title}
              title={item.title}
              links={item.links}
              isOpen={openDropdown === item.title}
              isMainOpen={isOpen}
              isActive={openDropdown === item.title}
              onClick={() => handleDropdownToggle(item.title)}
            />
          ))}
        </ul>
      </nav>
    </div>
  );
}