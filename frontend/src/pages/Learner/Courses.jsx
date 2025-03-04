import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";

const Courses = () => {
  return (
    <Container className="mt-4">
      <h2>All Courses</h2>
      <Row>
        {[1, 2, 3, 4].map((id) => (
          <Col md={4} key={id}>
            <Card className="mb-3 shadow">
              <Card.Body>
                <Card.Title>Course {id}</Card.Title>
                <Button variant="primary">View Course</Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Courses;
