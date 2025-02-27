import { Link } from "react-router-dom";

const Header = () => {
    return (
        <header className="ms-auto w-50" style={{height: "60px"}}>
            <Link to="/">
                <img
                    src="/logo.png"
                    alt="Logo"
                    className="mb-3"
                    style={{ width: "200px", position: "absolute", top: "10px", left: "10px" }}
                />
            </Link>
        </header>
    );
};

export default Header;
