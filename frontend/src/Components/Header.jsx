import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { useSelector } from "react-redux";

const Header = ({ toggleSidebar }) => {
    const [isSticky, setIsSticky] = useState(false);
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    
    // Check if current route is an auth route
    const isAuthRoute = ['/', '/forgot-password', '/reset-password'].includes(location.pathname);
    
    // Handle scroll event to make header sticky
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setIsSticky(true);
            } else {
                setIsSticky(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        
        // Clean up
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <header style={{
            padding: '10px 20px',
            backgroundColor: 'white',
            boxShadow: isSticky ? '0 5px 15px rgba(0, 0, 0, 0.1)' : '0 2px 10px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease',
            width: '100%',
            zIndex: 1000,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: isSticky ? '65px' : '75px'
        }}>
            <div>
                <Link to={user ? (user.role === "admin" ? "/admin/dashboard" : user.role === "instructor" ? "/instructor/dashboard" : "/home") : "/"}>
                    <img
                        src="/logo.png"
                        alt="Logo"
                        style={{ 
                            height: isSticky ? '45px' : '50px',
                            transition: 'all 0.3s ease',
                            marginLeft: '5px'
                        }}
                    />
                </Link>
            </div>
            
            {user && !isAuthRoute && (
                <button
                    onClick={toggleSidebar}
                    style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                        border: "none",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                        padding: 0,
                        cursor: "pointer",
                        color: "white"
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = "scale(1.05)";
                        e.target.style.boxShadow = "0 4px 10px rgba(0, 98, 230, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = "scale(1)";
                        e.target.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
                    }}
                >
                    <FaBars />
                </button>
            )}
        </header>
    );
};

export default Header;
