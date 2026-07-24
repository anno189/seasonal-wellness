import { Outlet } from "react-router-dom"
import Nav from "@/components/Nav"
import RightSidebar from "@/components/RightSidebar"

export default function Layout() {
  return (
    <div className="one-screen">
      <Nav />
      <div className="card overflow-y-auto scrollable">
        <div className="flex flex-col lg:flex-row min-h-0 overflow-y-auto scrollable">
          {/* Left content — switches on menu click */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 p-6 overflow-y-auto scrollable">
              <Outlet />
            </div>
          </div>
          {/* Right sidebar — always visible */}
          <div className="lg:w-96 flex-shrink-0 min-h-0 border-t lg:border-t-0 lg:border-l border-bone-soft/8 overflow-y-auto scrollable">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  )
}
