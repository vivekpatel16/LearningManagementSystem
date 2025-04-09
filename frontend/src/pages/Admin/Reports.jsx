import React, { useState, useEffect } from "react";
import { Container, Table, Button, Card, Form, Spinner } from "react-bootstrap";
import { FaFilePdf } from "react-icons/fa";
import Admin_API from "../../Api/adminApi";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
    (report.email && report.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const generatePDF = (learner) => {
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add title
      doc.setFontSize(18);
      doc.setTextColor(0, 51, 102);
      const title = "Learner Progress Report";
      const titleWidth = doc.getStringUnitWidth(title) * doc.internal.getFontSize() / doc.internal.scaleFactor;
      const titleX = (pageWidth - titleWidth) / 2;
      doc.text(title, titleX, 20);
      
      // Add learner details
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Name: ${learner.name || 'N/A'}`, 14, 40);
      doc.text(`Email: ${learner.email || 'N/A'}`, 14, 48);
      doc.text(`Overall Progress: ${learner.progress || '0%'}`, 14, 56);
      doc.text(`Enrolled Courses: ${learner.enrolledCourses || 0}`, 14, 64);
      doc.text(`Completed Courses: ${learner.completedCourses || 0}`, 14, 72);
      doc.text(`Status: ${learner.status || 'Inactive'}`, 14, 80);
      doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 14, 88);
      
      // Add horizontal line
      doc.setLineWidth(0.5);
      doc.line(14, 92, pageWidth - 14, 92);
      
      // Add report summary
      doc.setFontSize(14);
      doc.text("Learning Progress Summary", 14, 102);
      
      // Add summary table (using the imported autoTable function)
      autoTable(doc, {
        startY: 110,
        head: [['Metric', 'Value']],
        body: [
          ['Progress', learner.progress || '0%'],
          ['Enrolled Courses', learner.enrolledCourses || 0],
          ['Completed Courses', learner.completedCourses || 0],
          ['Status', learner.status || 'Inactive']
        ],
        theme: 'striped',
        headStyles: { fillColor: [0, 51, 102], textColor: 255 },
        styles: { halign: 'center' },
        alternateRowStyles: { fillColor: [240, 240, 240] }
      });
      
      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Outamation Learning Management System", 14, doc.internal.pageSize.height - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, doc.internal.pageSize.height - 10);
      }
      
      // Save the PDF with a sanitized filename (remove special characters)
      const sanitizedName = (learner.name || 'Learner').replace(/[^a-z0-9]/gi, '_');
      doc.save(`Learner_Report_${sanitizedName}.pdf`);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

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
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
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
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => generatePDF(report)}
                      >
                        <FaFilePdf /> Generate PDF
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
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
