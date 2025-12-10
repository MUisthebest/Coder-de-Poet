import { NavLink } from "react-router-dom";
import { useSidebar } from "../../contexts/SidebarContext";
import { useAuth } from "../../contexts/AuthContext";

export default function Navigation_PC() {
  const { isOpen, setIsOpen } = useSidebar();
  const { user, isAuthenticated, loading , logout, isAdmin} = useAuth();

  return (
    <nav
      className={`bg-[#E3E3E3] shadow-lg rounded-3xl border-[1px] border-[#aaa] h-[96vh] flex flex-col transition-all duration-300 ease-in-out
        ${isOpen ? "w-[20vw]" : "w-[8vw]"}`}
    >
      {/* TOP SECTION */}
      <div className="flex flex-col py-6 space-y-6 w-full">
        {/* LOGO - CỐ ĐỊNH TRONG CỘT 80px */}
        <div className={`flex items-center justify-center ${isOpen ? "w-full" : ""}`}>
          <img
            src="https://res.cloudinary.com/drjlezbo7/image/upload/v1763281600/Thi%E1%BA%BFt_k%E1%BA%BF_ch%C6%B0a_c%C3%B3_t%C3%AAn_p2izym.png"
            alt="logo"
            className="object-contain rounded-lg h-[calc(12vh)]"
          />
        </div>

        {/* TOGGLE BUTTON - CĂN GIỮA TRONG CỘT 80px */}
        <div className="flex items-center w-full justify-start">
          <div className="w-[8vw] flex items-center justify-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-center text-[#000] hover:text-indigo-600 bg-white
                         rounded-2xl border border-gray-300  hover:border-[#ccc]
                         transition-all duration-200"
            >
              <i className="bx bx-menu text-[calc(16px_+_2vw)] p-1"></i>
            </button>
          </div>
        </div>

        {/* MENU ITEMS */}
        <ul className="flex flex-col space-y-1 text-gray-700 font-medium flex-1 gap-[calc(1vh_+_5px)]">
          <NavItem to={`${user===null?'/':user.role === "Admin" ? '/admin': user.role === "Instructor" ? '/instructor/dashboard':'/'}`} label={`${isAdmin ? 'Total': 'Dashboard'}`} icon="home-alt-2" isOpen={isOpen} />
          <NavItem to={`${isAdmin ? '/admin/courses': '/courses'}`} label={`${isAdmin ? 'Manage Courses': 'Courses'}`} icon="book" isOpen={isOpen} />
          <NavItem to="/book" label={`${isAdmin ? 'Manage Library': 'Library'}`} icon="book-open" isOpen={isOpen} />
          <NavItem to="/calendar" label="Calendar" icon="calendar-alt" isOpen={isOpen} />
        </ul>
      </div>

      {/* USER SECTION - CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP */}
      <div className={`flex  py-6 justify-start ${isOpen? 'w-[20vw]':'w-[8vw]'}`}>
        {loading ? (
          <div className="flex items-center justify-center h-16">
            <div className="animate-pulse bg-gray-300 rounded-full w-12 h-12"></div>
          </div>
        ) : isAuthenticated && user ? (
          /* ĐÃ ĐĂNG NHẬP */
          <div className="flex gap-3 group  items-center align-center justify-flex">
            {/* Avatar */}
            <div className="w-[8vw] h-[8vw] flex justify-center items-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5">
                <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center overflow-hidden">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-indigo-600">
                      {user.fullName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Thông tin + Logout button (chỉ hiện khi mở rộng) */}
            {isOpen && (
              <div className="transition-all duration-300">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user.fullName || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
                <button
                  onClick={logout}
                  className="mt-2 px-4 py-2 border-1 bg-white rounded-2xl text-red-700 text-xs   hover:text-white hover:bg-red-600 font-medium transition all duration-200"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          /* CHƯA ĐĂNG NHẬP */
          <div className="flex items-center items-center align-center justify-start">
            <div className="w-[8vw] flex items-center justify-center">
              <div className="h-[calc(18px_+_2vw)] w-[calc(18px_+_2vw)] rounded-2xl bg-white flex items-center justify-center">
                <i className="bx bx-user text-2xl text-gray-600"></i>
              </div>
            </div>
            {isOpen && (
              <div className="flex-1 font-medium transition-all duration-300">
                <p className="text-sm font-medium text-gray-700">Guest</p>
                <div className="flex gap-2 mt-2 text-xs">
                  <NavLink to="/login" className="text-white hover:underline bg-[#D25D5D] border-[1px] border-gray-800 px-2 py-1 rounded-lg">
                    Login
                  </NavLink>
                  <span className="text-gray-400">|</span>
                  <NavLink to="/signup" className="text-blue-600 hover:underline bg-white border-[1px] border-blue-400 px-2 py-1 rounded-lg">
                    Sign Up
                  </NavLink>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

// NavItem riêng - icon cố định, label mượt
function NavItem({ to, label, icon, isOpen }) {
  return (
    <li>
      <NavLink to={to} end>
        {({ isActive }) => (
          <div className={`flex items-center justify-start h-[calc(16px_+_3vw)] rounded-md text-sm font-medium transition-all duration-200 hover:bg-[#ccc]`}>
            {/* CỘT ICON - CỐ ĐỊNH */}
            <div className="w-[8vw] h-full flex items-center justify-center px-1">
              <div
                className={`h-[calc(18px+2vw)] w-[calc(18px+2vw)] flex items-center justify-center rounded-xl transition
                ${isActive ? 'bg-black text-white' : 'bg-white text-black'}`}
              >
                <i className={`bx bx-${icon} text-3xl`}></i>
              </div>
            </div>
            {/* CỘT LABEL - ẨN HIỆN MƯỢT */}
            <span
              className={`flex-1 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out text-[#000] ${isOpen ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}
              style={{ transitionProperty: 'opacity, max-width' }}
            >
              {label}
            </span>
          </div>
        )}
      </NavLink>
    </li>
  );
}