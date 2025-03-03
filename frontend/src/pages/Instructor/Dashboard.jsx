import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import Sidebar from "./sidebar";
import Header from "../../Components/Header";

const Dashboard = () => {
  return (
    <>
      <Header />
      <div className="d-flex">
        <Sidebar />
        <Container className="mt-4 flex-grow-1">
          <h2 className="mb-4">Instructor Dashboard</h2>
          <Row>
            <Col md={4}>
              <Card className="shadow-sm">
                <Card.Body>
                  <h5>Total Students</h5>
                  <h3>150</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="shadow-sm">
                <Card.Body>
                  <h5>Enrolled Students</h5>
                  <h3>120</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="shadow-sm">
                <Card.Body>
                  <h5>Course Completion</h5>
                  <h3>75%</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default Dashboard;
