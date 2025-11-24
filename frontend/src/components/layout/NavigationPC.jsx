import { NavLink } from "react-router-dom";
import { useSidebar } from "../../contexts/SidebarContext";
import { useAuth } from "../../contexts/AuthContext";

export default function Navigation_PC() {
  const { isOpen, setIsOpen } = useSidebar();
  const { user, isAuthenticated, loading } = useAuth();

  return (
    <nav
      className={`bg-[#EFE9E3] shadow-lg rounded-3xl border-gray-200 h-[96vh] flex flex-col transition-all duration-300 ease-in-out
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
          <NavItem to="/" label="Dashboard" icon="home-alt-2" isOpen={isOpen} />
          <NavItem to="/courses" label="Courses" icon="book" isOpen={isOpen} />
          <NavItem to="/book" label="Library" icon="book-open" isOpen={isOpen} />
          <NavItem to="/calendar" label="Calendar" icon="calendar-alt" isOpen={isOpen} />
        </ul>
      </div>

      {/* USER SECTION - CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP */}
      {isAuthenticated && user && (
        <div className="flex items-center w-full justify-start mt-[2vh]">
          <div className="w-[8vw] flex items-center justify-center">
            <div className="w-[calc(16px_+_3vw)] h-[calc(16px_+_3vw)] rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold 
                            flex items-center justify-center text-sm transition-colors overflow-hidden">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-white text-xs">
                  {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          {isOpen && (
            <div className="flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300 flex-1">
              <span className="text-sm font-medium text-gray-800">
                {user.displayName || "User"}
              </span>
              <span className="text-xs text-gray-500">
                {user.email || "No email"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* LOGIN/SIGNUP SECTION - CHỈ HIỂN THỊ KHI CHƯA ĐĂNG NHẬP */}
      {!isAuthenticated && !loading && (
        <div className="flex items-center w-full justify-start mt-[2vh]">
          <div className="w-[8vw] flex items-center justify-center">
            <div className="w-[calc(16px_+_3vw)] h-[calc(16px_+_3vw)] rounded-2xl bg-gray-400 text-white font-bold 
                            flex items-center justify-center text-sm transition-colors">
              <i className="bx bx-user text-[calc(12px_+_1vw)]"></i>
            </div>
          </div>
          {isOpen && (
            <div className="flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300 flex-1">
              <span className="text-sm font-medium text-gray-800">Guest</span>
              <div className="flex gap-2 mt-1">
                <NavLink 
                  to="/login" 
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Login
                </NavLink>
                <span className="text-xs text-gray-400">|</span>
                <NavLink 
                  to="/signup" 
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Sign Up
                </NavLink>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

// NavItem riêng - icon cố định, label mượt
function NavItem({ to, label, icon, isOpen }) {
  return (
    <li>
      <NavLink to={to} end>
        {({ isActive }) => (
          <div className={`flex items-center justify-start h-[calc(16px_+_3vw)] rounded-md text-sm font-medium transition-all duration-200 hover:bg-[#D9CFC7]`}>
            {/* CỘT ICON - CỐ ĐỊNH */}
            <div className="w-[8vw] h-full flex items-center justify-center px-1">
              <i
                className={`bx bx-${icon} text-[calc(16px_+_2vw)] rounded-2xl border border-gray-300 p-1 ${isActive ? 'bg-[#000] text-[#fff]' : 'text-[#000] bg-white'}`}
              ></i>
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