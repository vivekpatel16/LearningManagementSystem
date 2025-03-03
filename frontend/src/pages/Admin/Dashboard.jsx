import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Table, Button, Spinner } from "react-bootstrap";
import Sidebar from "../../Components/Sidebar";
import Header from "../../Components/Header";
import API from "../../Api/authApi";
import { FaUsers, FaBook, FaUserGraduate, FaChartLine, FaChalkboardTeacher } from "react-icons/fa";

const Dashboard = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalInstructors, setTotalInstructors] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. Please log in.");
          return;
        }

        const response = await API.get("/users/courses");

        if (response.data) {
          setTotalUsers(response.data.totalUser);
          setTotalInstructors(response.data.totalInstructor);
          setTotalCourses(response.data.allCourses);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error.response?.data || error.message);
      }
    };

    const fetchRecentActivities = async () => {
      try {
        const response = await API.get("/users/recent-activities");
        setRecentActivities(response.data.data);
      } catch (error) {
        console.error("Error fetching recent activities:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    fetchRecentActivities();
  }, []);

  return (
    <>
      <Header />
      <div className="d-flex">
        <Sidebar />
        <Container className="mt-4 flex-grow-1">
          <h2 className="mb-4">Admin Dashboard</h2>
          <Row className="mb-4">
            <Col md={3}>
              <Card className="shadow text-center p-3">
                <FaUsers size={40} className="text-primary mb-2" />
                <h5>Total Users</h5>
                <h3>{totalUsers}</h3>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="shadow text-center p-3">
                <FaBook size={40} className="text-success mb-2" />
                <h5>Total Courses</h5>
                <h3>{totalCourses}</h3>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="shadow text-center p-3">
                <FaUserGraduate size={40} className="text-warning mb-2" />
                <h5>Active Learners</h5>
                <h3>0</h3>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="shadow text-center p-3">
                <FaChalkboardTeacher size={40} className="text-info mb-2" />
                <h5>Total Instructors</h5>
                <h3>{totalInstructors}</h3>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={8}>
              <Card className="shadow mt-3">
                <Card.Body>
                  <h5><FaChartLine className="me-2 text-primary" /> Recent Activities</h5>
                  {loading ? (
                    <Spinner animation="border" />
                  ) : (
                    <Table striped bordered hover className="mt-3">
                      <thead>
                        <tr>
                          <th>Index</th>
                          <th>Activity</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentActivities.map((activity, index) => (
                          <tr key={activity._id}>
                            <td>{index + 1}</td>
                            <td>{activity.action}</td>
                            <td>{new Date(activity.timestamp).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="shadow p-4 ms-auto mt-3" style={{ width: "300px", height: "290px" }}>
                <h5>Quick Links</h5>
                <Button variant="primary" size="md" className="w-100 mb-3 mt-4" href="/Admin/Courses">
                  Manage Courses
                </Button>
                <Button variant="success" size="md" className="w-100 mb-3" href="/Admin/Users">
                  Manage Users
                </Button>
                <Button variant="danger" size="md" className="w-100 mb-3" href="/Admin/Reports">
                  View Reports
                </Button>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default Dashboard;
