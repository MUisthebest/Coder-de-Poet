import React, { useState } from "react";

import { NavLink } from "react-router-dom";



export default function Navigation_Mobile() {

  const [isOpen, setIsOpen] = useState(false);



  const getNavLinkClasses = ({ isActive }) =>

    `font-medium transition-colors ${

      isActive

        ? "text-indigo-600"

        : "text-gray-700 hover:text-indigo-600"

    }`;



  const getMobileNavLinkClasses = ({ isActive }) =>

    `block py-2 px-4 rounded-md transition-colors ${

      isActive

        ? "text-indigo-600 bg-indigo-50"

        : "text-gray-700 hover:text-indigo-600 hover:bg-gray-100"

    }`;



  const handleMobileLinkClick = () => {

    setIsOpen(false);

  };



  return (

    // NAV CHÍNH (HEADER)

    // CẬP NHẬT: Thêm 'relative' để làm neo cho menu absolute

    <nav className="bg-[#EFE9E3] shadow-lg rounded-3xl p-4 w-full relative">

      {/* CẬP NHẬT: Thêm 'relative z-20' để luôn nổi lên trên menu blur */}

      <div className="container mx-auto flex justify-between items-center relative z-20">

        

        {/* 1. User */}

        <NavLink to="/" onClick={handleMobileLinkClick}>

          <img

            src="https://scontent.fsgn2-3.fna.fbcdn.net/v/t39.30808-1/537187856_1444879253437802_3963755224737322732_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=107&ccb=1-7&_nc_sid=e99d92&_nc_ohc=L7OzKlm4yxwQ7kNvwFpE3nB&_nc_oc=Adk-URB0xXkMOoRZRxJKF_yd0nOSjiabcU1vXTkzvkYxHbewcqHrZGgwyYIcIKBAo0c&_nc_zt=24&_nc_ht=scontent.fsgn2-3.fna&_nc_gid=wzfftZI3TpNEWd6-9lQRXw&oh=00_AfiGppeoDDWfCczl-zVpycPpuwCD3VNo1FH5buw2-f4Hlw&oe=691F7CCC"

            alt="avatar"

            className="object-cover rounded-full h-12 w-12"

          />

        </NavLink>



        {/* 2. Menu cho Desktop (md trở lên) */}

        <ul className="hidden md:flex items-center space-x-6">

          {/* ... (các NavLink desktop không đổi) ... */}

          <li>

            <NavLink to="/" className={getNavLinkClasses}>

              Dashboard

            </NavLink>

          </li>

          <li>

            <NavLink to="/courses" className={getNavLinkClasses}>

              Courses

            </NavLink>

          </li>

          <li>

            <NavLink to="/book" className={getNavLinkClasses}>

              Library

            </NavLink>

          </li>

          <li>

            <NavLink to="/calendar" className={getNavLinkClasses}>

              Calendar

            </NavLink>

          </li>

          <li>

            <NavLink to="/setting" className={getNavLinkClasses}>

              Settings

            </NavLink>

          </li>

          <li>

           <img
            src="https://scontent.fsgn8-4.fna.fbcdn.net/v/t39.30808-1/537187856_1444879253437802_3963755224737322732_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=107&ccb=1-7&_nc_sid=e99d92&_nc_ohc=h5x2ZoWUPDgQ7kNvwFjlLWm&_nc_oc=AdlIokzGZDGz20b0LR4Xr8BzbBHKkDgtRvlEkJAWGYFRElnaZs0y_E-UQXgBxqOsm_w&_nc_zt=24&_nc_ht=scontent.fsgn8-4.fna&_nc_gid=Pi6owJztdExPiGAMe-2fPQ&oh=00_AfifQeh_D6juSj9Cy6Mh2aVe4Th3slLxBc78H785y71Acw&oe=69279E0C"
            alt="logo"

              className="object-cover rounded-full h-10 w-10"

            />

          </li>

        </ul>



        {/* 3. Nút Bấm Mobile (Chỉ hiện trên mobile) */}

        <div className="md:hidden flex items-center space-x-2">

          <button

            className="text-gray-700 hover:text-indigo-600 p-2 rounded-full border border-gray-300 hover:border-indigo-300 transition-all duration-200"

            aria-label="Notifications"

          >

            <i className="bx bx-bell text-3xl"></i>

          </button>

          <button

            onClick={() => setIsOpen(!isOpen)}

            className="text-gray-700 hover:text-indigo-600 p-2 rounded-md"

            aria-label="Toggle menu"

          >

            <i className={`bx ${isOpen ? 'bx-x' : 'bx-menu'} text-3xl`}></i>

          </button>

        </div>

      </div>



      {/* 4. Menu xổ xuống cho Mobile */}

      {/* CẬP NHẬT:

        - Thêm 'absolute top-0 left-0 w-full h-screen' -> Chiếm toàn màn hình, bắt đầu từ top 0 của 'nav'

        - Thêm 'bg-[#EFE9E3]/90' -> Thêm độ trong suốt (90%) để thấy blur

        - Thêm 'backdrop-blur-sm' -> Thêm hiệu ứng blur nhẹ

        - Thêm 'z-10' -> Nằm dưới header (có z-20)

        - Thay 'transition-all' và 'block/hidden' thành 'transition-opacity duration-300' và 'opacity-100 visible' / 'opacity-0 invisible' để có hiệu ứng fade-in/out mượt mà

      */}

      <div 

        className={`

          absolute top-0 left-0 w-full h-screen bg-[#EFE9E3]/90 backdrop-blur-sm z-10 

          md:hidden transition-opacity duration-300 ease-in-out

          ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}

        `}

      >

        {/* CẬP NHẬT: Thay 'mt-4 px-2' thành 'pt-24 px-4' 

            'pt-24' (6rem) để đẩy list menu xuống dưới header (header cao ~5rem)

        */}

        <ul className="flex flex-col space-y-2 pt-24 px-4">

          <li>

            <NavLink to="/" className={getMobileNavLinkClasses} onClick={handleMobileLinkClick}>

              Dashboard

            </NavLink>

          </li>

          <li>

            <NavLink to="/courses" className={getMobileNavLinkClasses} onClick={handleMobileLinkClick}>

              Courses

            </NavLink>

          </li>

          <li>

            <NavLink to="/book" className={getMobileNavLinkClasses} onClick={handleMobileLinkClick}>

              Library

            </NavLink>

          </li>

          <li>

            <NavLink to="/calendar" className={getMobileNavLinkClasses} onClick={handleMobileLinkClick}>

              Calendar

            </NavLink>

          </li>

          <li>

            <NavLink to="/setting" className={getMobileNavLinkClasses} onClick={handleMobileLinkClick}>

              Settings

            </NavLink>

          </li>

        </ul>

      </div>

    </nav>

  );

}