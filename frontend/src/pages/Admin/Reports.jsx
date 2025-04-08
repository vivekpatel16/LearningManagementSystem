import React, { useState, useEffect } from "react";
import { Container, Table, Button, Card, Form, Spinner } from "react-bootstrap";
import { FaFilePdf } from "react-icons/fa";
import Admin_API from "../../Api/adminApi";

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLearnerReport = async () => {
      try {
        setLoading(true);
        const response = await Admin_API.get("/learner-report");
        console.log("API Response:", response.data); // Debug log
        if (response.status === 200) {
          setReports(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching learner report:", error);
        setError("Failed to load learner report data");
      } finally {
        setLoading(false);
      }
    };

    fetchLearnerReport();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredReports = reports.filter((report) =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container className="mt-4">
      <Card className="shadow p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">Learner Reports</h4>
          <Form.Control
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-25"
          />
        </div>
        {loading ? (
          <div className="text-center p-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <Table striped bordered hover responsive>
            <thead className="table-dark">
              <tr>
                <th>Index</th>
                <th>Name</th>
                <th>Email</th>
                <th>Progress</th>
                <th>Enrolled Courses</th>
                <th>Completed Courses</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.index}>
                  <td>{report.index}</td>
                  <td>{report.name}</td>
                  <td>{report.email}</td>
                  <td>{report.progress}</td>
                  <td>{report.enrolledCourses}</td>
                  <td>{report.completedCourses}</td>
                  <td>
                    <span className={`badge ${report.status === 'Active' ? 'bg-success' : 'bg-warning'}`}>
                      {report.status}
                    </span>
                  </td>
                  <td>
                    <Button variant="danger" size="sm">
                      <FaFilePdf /> Generate PDF
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </Card>
    </Container>
  );
};

export default Reports;
