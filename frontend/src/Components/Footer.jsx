import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-3 mt-auto">
      <div className="container text-center">
        <div className="row">
          {/* Footer Links */}

          {/* Social Media Links */}
          <div className="col-md-6">
            <h5>Follow Us</h5>
            <div>
              <a href="https://facebook.com" className="text-light me-3" target="_blank" rel="noopener noreferrer">
                <FaFacebook size={20} />
              </a>
              <a href="https://twitter.com" className="text-light me-3" target="_blank" rel="noopener noreferrer">
                <FaTwitter size={20} />
              </a>
              <a href="https://linkedin.com" className="text-light me-3" target="_blank" rel="noopener noreferrer">
                <FaLinkedin size={20} />
              </a>
              <a href="https://instagram.com" className="text-light" target="_blank" rel="noopener noreferrer">
                <FaInstagram size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-3">
          <p className="mb-0">&copy; {new Date().getFullYear()} Copyright 2025. Outamation Inc. All rights reserved. .</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
