import React, { useState, useEffect } from "react"; 
import { Card, Container, Row, Col, Modal, Table, Spinner } from "react-bootstrap";
import { FaChalkboardTeacher, FaBook } from "react-icons/fa";
import common_API from "../../Api/commonApi";

const Dashboard = () => {
  const [showCourses, setShowCourses] = useState(false);
  const [courses, setCourses] = useState([]);
  const [totalEnrolled, setTotalEnrolled] = useState(0);
  const [instructorCoursesCount, setInstructorCoursesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await common_API.get("/courses"); 
        const result =response.data;
        console.log(response);
        if (response.status==200||response.status==202) {
          setCourses(result.data || []);
          // setTotalEnrolled(result.totalUser || 0);
          setInstructorCoursesCount(result.instructorCoursesCount || 0); 
        } else {
          console.error("Error fetching courses:", result.message);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
            <Card className="shadow-sm p-3 mb-4">
              <Card.Body className="d-flex align-items-center">
                <FaChalkboardTeacher size={40} className="me-3 text-success" />
                <div>
                  <h5>Enrolled Learners</h5>
                  <p className="mb-0">{totalEnrolled}</p>
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
                  <p className="mb-0">{instructorCoursesCount}</p> 
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      
      <Modal show={showCourses} onHide={() => setShowCourses(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Courses Added</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
