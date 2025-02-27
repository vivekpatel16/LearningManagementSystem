import React from "react";
import { Container, Row, Col, Card, Table, Button } from "react-bootstrap";
import { FaUsers, FaBook, FaUserGraduate, FaChartLine, FaChalkboardTeacher } from "react-icons/fa";

const Dashboard = () => {
  // Temporary static data for internal LMS
  const stats = {
    totalUsers: 1200,
    totalCourses: 45,
    activeLearners: 850,
    totalInstructors: 30,
  };

  const recentActivities = [
    { id: 1, name: "Alice Johnson", action: "Enrolled in JavaScript Course", time: "2 hours ago" },
    { id: 2, name: "Michael Smith", action: "Signed up as a new learner", time: "5 hours ago" },
    { id: 3, name: "Sarah Williams", action: "Completed Python Basics", time: "1 day ago" },
    { id: 4, name: "David Brown", action: "Added a new Machine Learning Course", time: "2 days ago" },
  ];

  return (
    <Container className="mt-4">
      {/* Key Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow text-center p-3">
            <FaUsers size={40} className="text-primary mb-2" />
            <h5>Total Users</h5>
            <h3>{stats.totalUsers}</h3>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow text-center p-3">
            <FaBook size={40} className="text-success mb-2" />
            <h5>Total Courses</h5>
            <h3>{stats.totalCourses}</h3>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow text-center p-3">
            <FaUserGraduate size={40} className="text-warning mb-2" />
            <h5>Active Learners</h5>
            <h3>{stats.activeLearners}</h3>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow text-center p-3">
            <FaChalkboardTeacher size={40} className="text-info mb-2" />
            <h5>Total Instructors</h5>
            <h3>{stats.totalInstructors}</h3>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities */}
      <Row>
        <Col md={8}>
          <Card className="shadow  mt-3">
            <Card.Body>
              <h5><FaChartLine className="me-2 text-primary" /> Recent Activities</h5>
              <Table striped bordered hover className="mt-3">
                <thead>
                  <tr>
                    <th>Index</th>
                    <th>User</th>
                    <th>Activity</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((activity, index) => (
                    <tr key={activity.id}>
                      <td>{index + 1}</td>
                      <td>{activity.name}</td>
                      <td>{activity.action}</td>
                      <td>{activity.time}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Links */}
        <Col md={4}>
          <Card className="shadow p-4 ms-auto mt-3 " style={{width: "300px", height: "290px"}} >
            <h5>Quick Links</h5>
            <Button variant="primary" size="md" className="w-55 mb-3 mt-4" href="/Admin/Courses">
              Manage Courses
            </Button>
            <Button variant="success" size="md" className="w-55 mb-3" href="/Admin/Users">
              Manage Users
            </Button>
            <Button variant="danger" size="md" className="w-55 mb-3" href="/Admin/Reports">
              View Reports
            </Button>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
