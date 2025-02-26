import React, { useState } from "react";
import { Container, Table, Button, Card, Form } from "react-bootstrap";
import { FaFilePdf } from "react-icons/fa";

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [reports ] = useState([
    { id: 1, name: "Alice Johnson", progress: "80%", completedCourses: 5, status: "Active" },
    { id: 2, name: "Michael Smith", progress: "65%", completedCourses: 3, status: "Active" },
    { id: 3, name: "Sarah Williams", progress: "90%", completedCourses: 6, status: "Inactive" },
  ]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredReports = reports.filter((report) =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container className="mt-4">
      <Card className="shadow p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">Learner Reports</h4>
          <Form.Control
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-25"
          />
        </div>
        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th>Index</th>
              <th>Name</th>
              <th>Progress</th>
              <th>Completed Courses</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report, index) => (
              <tr key={report.id}>
                <td>{index + 1}</td>
                <td>{report.name}</td>
                <td>{report.progress}</td>
                <td>{report.completedCourses}</td>
                <td>{report.status}</td>
                <td>
                  <Button variant="danger" size="sm">
                    <FaFilePdf /> Generate PDF
                  </Button>
                </td>
              </tr>
          ))}
          {filteredReports.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center">
                No users found
              </td>
            </tr>
          )}
          </tbody>
        </Table>
      </Card>
    </Container>
  );
};

export default Reports;
