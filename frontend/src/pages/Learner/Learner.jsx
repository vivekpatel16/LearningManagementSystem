import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "../../Components/Header"; 
import Footer from "../../Components/Footer";  // ✅ Ensure Header is correctly exported
import Home from "./Home";
import Courses from "./Courses";
import MyLearning from "./MyLearning";
import Wishlist from "./Wishlist";
import Profile from "./Profile";
import Sidebar from "./Sidebar"; 
import { Container, Row, Col } from "react-bootstrap";

const Learner = () => {
  return (
    <Container fluid>
      {/* Header */}
      <Row>
        <Col>
          <Header />        
        </Col>
      </Row>

      <Row>
        {/* Main Content (Full Width) */}
        <Col md={12} className="p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/my-learning" element={<MyLearning />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Col>
      </Row>

      {/* Sidebar (Hidden until toggled) */}
      <Sidebar />
    </Container>
  );
};

export default Learner;
