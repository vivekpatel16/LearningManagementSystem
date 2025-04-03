import React from "react";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="text-center mt-3">
      <h6>Follow Us</h6>
      <div className="d-flex justify-content-center gap-2">
        <a href="https://facebook.com" className="text-dark"><FaFacebook size={20} /></a>
        <a href="https://twitter.com" className="text-dark"><FaTwitter size={20} /></a>
        <a href="https://linkedin.com" className="text-dark"><FaLinkedin size={20} /></a>
        <a href="https://instagram.com" className="text-dark"><FaInstagram size={20} /></a>
      </div>
      <p className="mb-0">&copy; {new Date().getFullYear()} Outamation Inc.</p>
    </footer>
  );
};

export default Footer;
