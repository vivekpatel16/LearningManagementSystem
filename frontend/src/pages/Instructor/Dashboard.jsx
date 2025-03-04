import React, { useState, useEffect } from "react"; 
import { Card, Container, Row, Col, Modal, Table, Spinner, ProgressBar, Form } from "react-bootstrap";
import { FaChalkboardTeacher, FaBook } from "react-icons/fa";

const Dashboard = () => {
  const [showEnrolled, setShowEnrolled] = useState(false);
  const [showCourses, setShowCourses] = useState(false);
  const [enrolledLearners, setEnrolledLearners] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulated data (Replace with actual API calls)
        const enrolledData = [
          { id: 1, name: "Alice Brown", email: "alice@example.com", course: "React Basics", progress: 70 },
          { id: 2, name: "Michael Johnson", email: "michael@example.com", course: "Advanced Node.js", progress: 50 },
          { id: 3, name: "Emily Davis", email: "emily@example.com", course: "React Basics", progress: 90 },
        ];

        const coursesData = [
          { id: 1, title: "React Basics", category: "Web Development", description: "Introduction to React" },
          { id: 2, title: "Advanced Node.js", category: "Backend Development", description: "Deep dive into Node.js" },
          { id: 3, title: "UI/UX Design", category: "Design", description: "Learn the principles of UI/UX" },
        ];

        setEnrolledLearners(enrolledData);
        setCourses(coursesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter learners based on search input
  const filteredLearners = enrolledLearners.filter((learner) =>
    learner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    learner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    learner.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container fluid className="mt-4">
      <h2 className="mb-4">Instructor Dashboard</h2>
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <Row>
          <Col md={6}>
            <Card className="shadow-sm p-3 mb-4 cursor-pointer" onClick={() => setShowEnrolled(true)}>
              <Card.Body className="d-flex align-items-center">
                <FaChalkboardTeacher size={40} className="me-3 text-success" />
                <div>
                  <h5>Enrolled Learners</h5>
                  <p className="mb-0">{enrolledLearners.length}</p>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="shadow-sm p-3 mb-4 cursor-pointer" onClick={() => setShowCourses(true)}> 
              <Card.Body className="d-flex align-items-center">
                <FaBook size={40} className="me-3 text-warning" />
                <div>
                  <h5>Courses Added</h5>
                  <p className="mb-0">{courses.length}</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Modal for Enrolled Learners with Progress Tracking */}
      <Modal show={showEnrolled} onHide={() => setShowEnrolled(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Enrolled Learners & Progress Tracking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Search Field */}
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Search by name, email, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Form.Group>

          {/* Learner Table with Progress */}
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Index</th>
                <th>Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {filteredLearners.length > 0 ? (
                filteredLearners.map((learner, index) => (
                  <tr key={learner.id}>
                    <td>{index + 1}</td>
                    <td>{learner.name}</td>
                    <td>{learner.email}</td>
                    <td>{learner.course}</td>
                    <td>
                      <ProgressBar now={learner.progress} label={`${learner.progress}%`} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-danger">
                    No learners found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Modal.Body>
      </Modal>

      {/* Modal for Courses with Category Field */}
      <Modal show={showCourses} onHide={() => setShowCourses(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Courses Added</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Courses Table */}
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Index</th>
                <th>Course Name</th>
                <th>Category</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {courses.length > 0 ? (
                courses.map((course, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{course.title}</td>
                    <td>{course.category}</td>
                    <td>{course.description}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-danger">
                    No courses added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Dashboard;
