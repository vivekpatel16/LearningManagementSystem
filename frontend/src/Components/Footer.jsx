import React from "react";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <div className="container text-center">
        {/* Social Media Links - Centered */}
        <div className="mb-3">
          <h5>Follow Us</h5>
          <div className="d-flex justify-content-center gap-3">
            <a href="https://facebook.com" className="text-light" target="_blank" rel="noopener noreferrer">
              <FaFacebook size={24} />
            </a>
            <a href="https://twitter.com" className="text-light" target="_blank" rel="noopener noreferrer">
              <FaTwitter size={24} />
            </a>
            <a href="https://linkedin.com" className="text-light" target="_blank" rel="noopener noreferrer">
              <FaLinkedin size={24} />
            </a>
            <a href="https://instagram.com" className="text-light" target="_blank" rel="noopener noreferrer">
              <FaInstagram size={24} />
            </a>
          </div>
        </div>

        {/* Copyright Section - Centered Below */}
        <div>
          <p className="mb-0">&copy; {new Date().getFullYear()} Outamation Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
