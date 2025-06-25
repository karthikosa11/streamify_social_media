import Sidebar from "./Sidebar.jsx";
import Navbar from "./Navbar";

const Layout = ({ children, showSidebar = false }) => {
  return (
    <div className='min-h-screen bg-base-100'>
      <div className='flex w-full'>
        {showSidebar && <Sidebar />}

        <div className='flex-1 flex flex-col'>
          <Navbar />

          <main className='flex-1 overflow-y-auto bg-base-100 p-4 lg:p-6 pb-20 lg:pb-6'>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
export default Layout;
