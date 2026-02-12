import { NavLink } from 'react-router-dom'
import {
  Search,
  User,
  Mail,
  Settings,
  GraduationCap
} from 'lucide-react'

const navItems = [
  { to: '/search', label: 'Search', icon: Search },
  { to: '/emails', label: 'Emails', icon: Mail },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings }
]

export function Sidebar() {
  return (
    <aside className="flex h-full w-56 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
        <GraduationCap className="h-6 w-6 text-primary-600" />
        <span className="text-lg font-bold text-gray-900">
          Research Reach
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 px-5 py-3">
        <p className="text-xs text-gray-400">Research Reach v1.0</p>
      </div>
    </aside>
  )
}
