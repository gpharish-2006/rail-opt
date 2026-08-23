import { useState } from "react";
import {
  LayoutDashboard,
  Wrench,
  TrainFront,
  CalendarDays,
  BarChart3,
  AlertTriangle,
  BrainCircuit,
  Menu,
  Bell,
  Search,
  Route as RouteIcon,
} from "lucide-react";

import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MaintenancePage from "./pages/MaintenancePage";
import BlockPlannerPage from "./pages/BlockPlannerPage";
import WeeklyPlanPage from "./pages/WeeklyPlanPage";
import BeforeAfterPage from "./pages/BeforeAfterPage";
import AnalyticsPage from "./pages/AnalyticsPage";

import "./App.css";


/* =========================================================
   SIDEBAR MENU
========================================================= */

const menuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Maintenance",
    path: "/maintenance",
    icon: Wrench,
  },
  {
    name: "Assets",
    path: "/assets",
    icon: TrainFront,
  },
  {
    name: "AI Block Planner",
    path: "/block-planner",
    icon: BrainCircuit,
  },
  {
    name: "Weekly Plan",
    path: "/weekly-plan",
    icon: CalendarDays,
  },
  {
    name: "Before vs After",
    path: "/before-after",
    icon: RouteIcon,
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Emergency",
    path: "/emergency",
    icon: AlertTriangle,
  },
];


/* =========================================================
   MAIN LAYOUT
========================================================= */

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentItem =
    menuItems.find((item) => item.path === location.pathname) ||
    menuItems[0];

  const activePage = currentItem.name;


  return (
    <div className="railopt-app">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`sidebar ${
          sidebarOpen ? "open" : "closed"
        }`}
      >

        {/* BRAND */}

        <div className="brand">

          <div className="brand-icon">
            <TrainFront size={25} />
          </div>

          {sidebarOpen && (
            <div>
              <h1>RailOpt AI</h1>
              <span>Railway Operations</span>
            </div>
          )}

        </div>


        {/* MENU */}

        <div className="sidebar-section">

          {sidebarOpen && (
            <p className="menu-title">
              OPERATIONS
            </p>
          )}


          {menuItems.map((item) => {

            const Icon = item.icon;

            const isActive =
              location.pathname === item.path;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  isActive ? "active" : ""
                }`}
                onClick={() => navigate(item.path)}
                title={!sidebarOpen ? item.name : ""}
              >

                <Icon size={20} />

                {sidebarOpen && (
                  <span>{item.name}</span>
                )}

              </button>
            );

          })}

        </div>


        {/* PROTOTYPE BOX */}

        {sidebarOpen && (
          <div className="prototype-box">

            <div className="prototype-dot"></div>

            <div>
              <strong>
                Prototype Mode
              </strong>

              <p>
                Simulated railway data
              </p>
            </div>

          </div>
        )}

      </aside>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="main-content">


        {/* ===================================================
            TOP BAR
        =================================================== */}

        <header className="topbar">

          <div className="topbar-left">

            <button
              className="menu-button"
              onClick={() =>
                setSidebarOpen(!sidebarOpen)
              }
            >
              <Menu size={22} />
            </button>


            <div>

              <div className="breadcrumb">
                RAILWAY OPERATIONS /
              </div>

              <h2>
                {activePage}
              </h2>

            </div>

          </div>


          {/* TOP RIGHT */}

          <div className="topbar-right">

            <div className="search-box">

              <Search size={18} />

              <input
                placeholder="Search..."
              />

            </div>


            <button className="notification-button">

              <Bell size={20} />

              <span></span>

            </button>


            <div className="user-profile">

              <div className="avatar">
                OP
              </div>

              <div className="user-info">

                <strong>
                  Operations User
                </strong>

                <small>
                  Control Office
                </small>

              </div>

            </div>

          </div>

        </header>


        {/* ===================================================
            PAGE CONTENT

            IMPORTANT:
            No colors/styles are added here.
            Your individual page CSS controls the appearance.
        =================================================== */}

        <div className="content">

          <Routes>

            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />

            <Route
              path="/maintenance"
              element={<MaintenancePage />}
            />

            <Route
              path="/assets"
              element={
                <div>
                  <h2>Assets</h2>
                  <p>
                    Asset management page coming soon.
                  </p>
                </div>
              }
            />

            <Route
              path="/block-planner"
              element={<BlockPlannerPage />}
            />

            <Route
              path="/weekly-plan"
              element={<WeeklyPlanPage />}
            />

            <Route
              path="/before-after"
              element={<BeforeAfterPage />}
            />

            <Route
              path="/analytics"
              element={<AnalyticsPage />}
            />

            <Route
              path="/emergency"
              element={
                <div>
                  <h2>Emergency</h2>
                  <p>
                    Emergency management page coming soon.
                  </p>
                </div>
              }
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

          </Routes>

        </div>

      </main>

    </div>
  );
}


/* =========================================================
   APP
========================================================= */

export default function App() {

  return (

    <Routes>

      {/* LOGIN */}

      <Route
        path="/login"
        element={<LoginPage />}
      />


      {/* ALL APPLICATION PAGES */}

      <Route
        path="/*"
        element={<DashboardLayout />}
      />

    </Routes>

  );
}