import React, { useState, useEffect } from "react";
import { Container, Table, Button, Card, Form, Spinner, Alert, Placeholder } from "react-bootstrap";
import { FaFilePdf, FaSearch, FaDownload, FaGraduationCap, FaBook, FaChartLine } from "react-icons/fa";
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
      // Create a new PDF document with blue theme
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Add decorative header with gradient background
      doc.setFillColor(0, 98, 230);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Add title
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      const title = "Learner Progress Report";
      const titleWidth = doc.getStringUnitWidth(title) * doc.internal.getFontSize() / doc.internal.scaleFactor;
      const titleX = (pageWidth - titleWidth) / 2;
      doc.text(title, titleX, 25);
      
      // Add current date at top right
    doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      const dateText = `Generated: ${new Date().toLocaleDateString()}`;
      doc.text(dateText, pageWidth - 15, 15, { align: 'right' });
      
      // Add learner info section with icon
      doc.setFillColor(240, 240, 240);
      doc.rect(14, 50, pageWidth - 28, 70, 'F');
      
      // Add learner info header
      doc.setFontSize(16);
      doc.setTextColor(0, 98, 230);
      doc.text("Learner Information", 20, 65);
      
      // Add horizontal line under section header
      doc.setDrawColor(0, 98, 230);
      doc.setLineWidth(0.5);
      doc.line(20, 68, 100, 68);
      
      // Add learner details
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(`Name:`, 20, 80);
      doc.text(`Email:`, 20, 95);

    doc.setFontSize(12);
      doc.setTextColor(20, 20, 20);
      doc.setFont(undefined, 'bold');
      doc.text(`${learner.name || 'N/A'}`, 60, 80);
      doc.text(`${learner.email || 'N/A'}`, 60, 95);
      doc.setFont(undefined, 'normal');
      
      // Add circular progress indicator
      const progressPercent = parseInt(learner.progress || '0');
      const centerX = 160;
      const centerY = 85;
      const radius = 20;
      
      // Draw progress circle background
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(3);
      doc.circle(centerX, centerY, radius, 'S');
      
      // Draw progress arc (if progress > 0)
      if (progressPercent > 0) {
        doc.setDrawColor(0, 98, 230);
        doc.setLineWidth(3);
        
        // Draw arc segments to simulate progress
        const segments = 36; // Number of segments to make the arc smoother
        const segmentsToFill = Math.floor(segments * progressPercent / 100);
        const angleIncrement = (2 * Math.PI) / segments;
        const startAngle = -Math.PI / 2; // Start from the top
        
        for (let i = 0; i < segmentsToFill; i++) {
          const startSegmentAngle = startAngle + (i * angleIncrement);
          const endSegmentAngle = startAngle + ((i + 1) * angleIncrement);
          
          doc.line(
            centerX + radius * Math.cos(startSegmentAngle),
            centerY + radius * Math.sin(startSegmentAngle),
            centerX + radius * Math.cos(endSegmentAngle),
            centerY + radius * Math.sin(endSegmentAngle)
          );
        }
      }
      
      // Add percentage text in the center
      doc.setFontSize(14);
      doc.setTextColor(0, 98, 230);
      doc.setFont(undefined, 'bold');
      const progressText = `${progressPercent}%`;
      const textWidth = doc.getStringUnitWidth(progressText) * doc.internal.getFontSize() / doc.internal.scaleFactor;
      doc.text(progressText, centerX - (textWidth / 2), centerY + 5);
      doc.setFont(undefined, 'normal');
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const progressLabel = "Progress";
      const labelWidth = doc.getStringUnitWidth(progressLabel) * doc.internal.getFontSize() / doc.internal.scaleFactor;
      doc.text(progressLabel, centerX - (labelWidth / 2), centerY + 15);
      
      // Add learning statistics section
      doc.setFillColor(250, 250, 250);
      doc.rect(14, 130, pageWidth - 28, 60, 'F');
      
      // Add statistics header
      doc.setFontSize(16);
      doc.setTextColor(0, 98, 230);
      doc.text("Learning Statistics", 20, 145);
      
      // Add horizontal line under section header
      doc.setDrawColor(0, 98, 230);
      doc.setLineWidth(0.5);
      doc.line(20, 148, 120, 148);
      
      // Create visually distinctive statistics boxes
      // Box 1 - Enrolled Courses
      drawStatBox(doc, 20, 155, 80, 25, learner.enrolledCourses || 0, "Enrolled Courses", [0, 98, 230]);
      
      // Box 2 - Completed Courses
      drawStatBox(doc, 110, 155, 80, 25, learner.completedCourses || 0, "Completed Courses", [46, 184, 46]);
      
      // Add footer with gradient
      doc.setFillColor(0, 98, 230);
      doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
      
      // Add footer text
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("Outamation Learning Management System", 14, pageHeight - 8);
      doc.text(`Page 1 of 1`, pageWidth - 14, pageHeight - 8, { align: 'right' });
      
      // Save the PDF with a sanitized filename
      const sanitizedName = (learner.name || 'Learner').replace(/[^a-z0-9]/gi, '_');
      doc.save(`Learner_Report_${sanitizedName}.pdf`);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };
  
  // Helper function to draw stat boxes
  const drawStatBox = (doc, x, y, width, height, value, label, color) => {
    // Draw box with border
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(1);
    doc.rect(x, y, width, height, 'FD');
    
    // Add value
    doc.setFontSize(14);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont(undefined, 'bold');
    doc.text(value.toString(), x + width / 2, y + 12, { align: 'center' });
    
    // Add label
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text(label, x + width / 2, y + 20, { align: 'center' });
  };

  if (loading) {
  return (
      <>
        {/* Full width header section - always show this */}
        <div className="w-100" style={{ 
          background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
          padding: '30px 0',
          color: 'white',
          borderBottomLeftRadius: '30px',
          borderBottomRightRadius: '30px',
          marginBottom: '25px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
        }}>
          <Container>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
              <div className="mb-3 mb-md-0">
                <h1 className="fw-bold mb-0">Learner Reports</h1>
                <p className="mb-0 opacity-75">Generate and manage learner progress reports</p>
              </div>
              {/* Desktop search - hidden on mobile - disabled during loading */}
              <div className="d-none d-md-flex position-relative">
                <div className="position-relative">
                  <Form.Control
                    disabled
                    className="search-placeholder"
                    placeholder="Search by name or email..."
                    style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '10px 20px',
                      paddingLeft: '45px',
                      width: '280px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    left: '16px',
                    top: '0',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FaSearch color="#0062E6" fontSize="14px" opacity="0.5" />
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </div>

        {/* Mobile search - only visible on mobile */}
        <Container className="d-md-none mb-4">
          <div className="position-relative">
            <Form.Control
              className="search-placeholder"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={handleSearch}
              style={{
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '50px',
                padding: '10px 20px',
                paddingLeft: '45px',
                height: '48px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}
            />
            <div style={{
              position: 'absolute',
              left: '16px',
              top: '0',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaSearch color="#0062E6" fontSize="14px" />
            </div>
          </div>
        </Container>

        {/* Skeleton for reports table */}
        <Container className="mb-4">
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead style={{ 
                  background: 'linear-gradient(to right, rgba(0, 98, 230, 0.08), rgba(51, 161, 253, 0.08))',
                  borderBottom: '2px solid rgba(0, 98, 230, 0.1)'
                }}>
                  <tr>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Index</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Name</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Email</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px',
                      textAlign: 'center'
                    }}>Progress</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Enrolled Courses</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Completed Courses</th>
                    <th style={{ 
                      width: '150px', 
                      padding: '18px 25px', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array(5).fill().map((_, index) => (
                    <tr key={index} style={{ 
                      backgroundColor: index % 2 === 0 ? 'white' : 'rgba(0, 98, 230, 0.01)'
                    }}>
                      <td style={{ padding: '18px 25px' }}>
                        <Placeholder animation="glow">
                          <Placeholder xs={1} bg="light" />
                        </Placeholder>
                      </td>
                      <td style={{ padding: '18px 25px' }}>
                        <Placeholder animation="glow">
                          <Placeholder xs={7} bg="light" />
                        </Placeholder>
                      </td>
                      <td style={{ padding: '18px 25px' }}>
                        <Placeholder animation="glow">
                          <Placeholder xs={8} bg="light" />
                        </Placeholder>
                      </td>
                      <td style={{ padding: '18px 25px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: 'rgba(0, 0, 0, 0.05)',
                          }}></div>
                        </div>
                      </td>
                      <td style={{ padding: '18px 25px' }}>
                        <Placeholder animation="glow">
                          <Placeholder xs={2} bg="light" />
                        </Placeholder>
                      </td>
                      <td style={{ padding: '18px 25px' }}>
                        <Placeholder animation="glow">
                          <Placeholder xs={2} bg="light" />
                        </Placeholder>
                      </td>
                      <td style={{ padding: '18px 25px' }}>
                        <div className="d-flex justify-content-center">
                          <div style={{
                            width: '60px',
                            height: '32px',
                            borderRadius: '6px',
                            background: 'rgba(0, 98, 230, 0.1)',
                          }}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Container>
      </>
    );
  }

  return (
    <>
      {/* Full width header section */}
      <div className="w-100" style={{ 
        background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
        padding: '30px 0',
        color: 'white',
        borderBottomLeftRadius: '30px',
        borderBottomRightRadius: '30px',
        marginBottom: '25px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
      }}>
        <Container>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <div className="mb-3 mb-md-0">
              <h1 className="fw-bold mb-0">Learner Reports</h1>
              <p className="mb-0 opacity-75">Generate and manage learner progress reports</p>
            </div>
            {/* Desktop search - hidden on mobile */}
            <div className="d-none d-md-flex position-relative">
              <div className="position-relative">
                <Form.Control
                  className="search-placeholder"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={handleSearch}
                  style={{
                    background: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '10px 20px',
                    paddingLeft: '45px',
                    width: '280px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  left: '16px',
                  top: '0',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaSearch color="#0062E6" fontSize="14px" />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Mobile search - only visible on mobile */}
      <Container className="d-md-none mb-4">
        <div className="position-relative">
          <Form.Control
            className="search-placeholder"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={handleSearch}
            style={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '50px',
              padding: '10px 20px',
              paddingLeft: '45px',
              height: '48px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}
          />
          <div style={{
            position: 'absolute',
            left: '16px',
            top: '0',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaSearch color="#0062E6" fontSize="14px" />
          </div>
        </div>
      </Container>

      {/* Table section */}
      <Container className="mb-4">
        {error ? (
          <Alert variant="danger" className="m-4" style={{ borderRadius: '10px', border: 'none' }}>
            {error}
          </Alert>
        ) : (
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead style={{ 
                  background: 'linear-gradient(to right, rgba(0, 98, 230, 0.08), rgba(51, 161, 253, 0.08))',
                  borderBottom: '2px solid rgba(0, 98, 230, 0.1)'
                }}>
                  <tr>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Index</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Name</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Email</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px',
                      textAlign: 'center'
                    }}>Progress</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Enrolled Courses</th>
                    <th style={{ 
                      padding: '18px 25px', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Completed Courses</th>
                    <th style={{ 
                      width: '150px', 
                      padding: '18px 25px', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#0062E6',
                      fontSize: '15px'
                    }}>Actions</th>
            </tr>
          </thead>
          <tbody>
                  {filteredReports.length > 0 ? (
                    filteredReports.map((report, index) => (
                      <tr key={report.index || index} style={{
                        backgroundColor: index % 2 === 0 ? 'white' : 'rgba(0, 98, 230, 0.01)',
                        transition: 'all 0.2s'
                      }}>
                        <td style={{ 
                          padding: '18px 25px',
                          fontSize: '15px',
                          color: '#495057',
                          fontWeight: '500'
                        }}>{report.index || index + 1}</td>
                        <td style={{ 
                          padding: '18px 25px',
                          fontSize: '15px',
                          color: '#495057',
                          fontWeight: '500'
                        }}>{report.name}</td>
                        <td style={{ 
                          padding: '18px 25px',
                          fontSize: '15px',
                          color: '#495057',
                          fontWeight: '500'
                        }}>{report.email}</td>
                        <td style={{ 
                          padding: '18px 25px',
                          fontSize: '15px',
                          color: '#495057',
                          fontWeight: '500',
                          textAlign: 'center'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{
                              position: 'relative',
                              width: '50px',
                              height: '50px',
                              borderRadius: '50%',
                              background: '#f0f0f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {/* Progress circle background */}
                              <svg width="50" height="50" viewBox="0 0 50 50">
                                <circle
                                  cx="25"
                                  cy="25"
                                  r="20"
                                  fill="none"
                                  stroke="#e9ecef"
                                  strokeWidth="5"
                                />
                                {/* Progress circle foreground */}
                                <circle
                                  cx="25"
                                  cy="25"
                                  r="20"
                                  fill="none"
                                  stroke="url(#blueGradient)"
                                  strokeWidth="5"
                                  strokeDasharray={`${2 * Math.PI * 20}`}
                                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - parseInt(report.progress || '0') / 100)}`}
                                  strokeLinecap="round"
                                  transform="rotate(-90 25 25)"
                                />
                                <defs>
                                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#0062E6" />
                                    <stop offset="100%" stopColor="#33A1FD" />
                                  </linearGradient>
                                </defs>
                              </svg>
                              {/* Percentage text */}
                              <div style={{
                                position: 'absolute',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#0062E6'
                              }}>
                                {report.progress || '0%'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ 
                          padding: '18px 25px',
                          fontSize: '15px',
                          color: '#495057',
                          fontWeight: '500'
                        }}>{report.enrolledCourses || 0}</td>
                        <td style={{ 
                          padding: '18px 25px',
                          fontSize: '15px',
                          color: '#495057',
                          fontWeight: '500'
                        }}>{report.completedCourses || 0}</td>
                        <td style={{ padding: '18px 25px' }}>
                          <div className="d-flex justify-content-center">
                  <Button
                              onClick={() => generatePDF(report)}
                    size="sm"
                              style={{
                                background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
                                border: 'none',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 15px',
                                fontWeight: '500',
                                transition: 'all 0.3s ease'
                              }}
                              className="btn-hover-effect"
                            >
                              <FaFilePdf /> PDF
                  </Button>
                          </div>
                </td>
              </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <div className="d-flex flex-column align-items-center">
                          <div style={{
                            background: 'rgba(0, 98, 230, 0.05)',
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '15px'
                          }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z" fill="#0062E6" opacity="0.5"/>
                            </svg>
                          </div>
                          <p className="mt-2 mb-0 fw-medium" style={{ color: '#495057' }}>No learners found</p>
                          {searchTerm && (
                            <p className="small text-muted mt-1">Try a different search term</p>
                          )}
                        </div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
            </Card.Body>
      </Card>
        )}
    </Container>

      {/* Custom CSS for button hover effects */}
      <style>
        {`
          .btn-hover-effect:hover {
            background: linear-gradient(135deg, #0056CD 0%, #2B8AD9 100%) !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(0, 98, 230, 0.2);
          }
          
          tbody tr:hover {
            background-color: rgba(0, 98, 230, 0.03) !important;
          }
        `}
      </style>
    </>
  );
};

export default Reports;