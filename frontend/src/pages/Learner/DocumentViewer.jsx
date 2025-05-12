import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { FaFileAlt, FaArrowLeft } from 'react-icons/fa';
import axiosInstance from '../../Api/axiosInstance';
import { getDocumentFromChapterContent } from '../../Api/documentApi';

const DocumentViewer = () => {
    const { id } = useParams(); // id is the ChapterContent _id
    const navigate = useNavigate();
    const location = useLocation();
    const [documentData, setDocumentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [courseTitle, setCourseTitle] = useState("");

    // Get API base URL from axiosInstance defaults
    const apiBaseUrl = axiosInstance.defaults.baseURL || 'http://localhost:5000/api';
    // Extract server URL (remove /api if present)
    const serverBaseUrl = apiBaseUrl.replace(/\/api$/, '');

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // First check if document data was passed via location state
                if (location.state?.documentData) {
                    console.log("Using document data from location state:", location.state.documentData);
                    setDocumentData(location.state.documentData);
                    setCourseTitle(location.state.courseTitle || "");
                    setLoading(false);
                    return;
                }
                
                // If not, fetch chapter content by id
                console.log("Fetching document data for id:", id);
                try {
                    const docData = await getDocumentFromChapterContent(id);
                    console.log("Document data received:", docData);
                    setDocumentData(docData);
                    setCourseTitle(location.state?.courseTitle || "");
                } catch (err) {
                    console.error("Error fetching document from API:", err);
                    // Fallback to direct fetch if API method fails
                    const response = await axiosInstance.get(`/chapter-content/${id}`);
                    if (response.data && response.data.content_type_ref === 'Document') {
                        console.log("Document data received via fallback:", response.data);
                        setDocumentData(response.data.contentDetails);
                        setCourseTitle(location.state?.courseTitle || "");
                    } else {
                        setError('Document not found or invalid content type.');
                    }
                }
            } catch (err) {
                console.error("Error fetching document:", err);
                setError(err.response?.data?.message || 'Failed to load document');
            } finally {
                setLoading(false);
            }
        };
        
        fetchDocument();
    }, [id, location, apiBaseUrl]);

    // Helper function to render PDF based on available URL formats
    const renderPdfViewer = () => {
        const pdfUrl = documentData?.url || documentData?.pdf_url;
        
        if (!pdfUrl) {
            return <Alert variant="warning">No PDF URL available for this document.</Alert>;
        }
        
        // Get the direct PDF URL
        const directPdfUrl = getDirectPdfUrl(pdfUrl);
        console.log("Displaying PDF with URL:", directPdfUrl);

        // Use Google Docs viewer as a fallback if the direct URL doesn't work
        const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(directPdfUrl)}&embedded=true`;
        
        return (
            <>
                <iframe
                    src={directPdfUrl}
                    title="PDF Document"
                    width="100%"
                    height="600px"
                    style={{ border: '1px solid #dee2e6', borderRadius: '0.375rem' }}
                    onError={(e) => {
                        console.error("Error loading PDF directly, falling back to Google Docs viewer");
                        e.target.src = googleDocsUrl;
                    }}
                />
                <div className="mt-3">
                    <Alert variant="info">
                        If the PDF doesn't load properly, you can <a href={directPdfUrl} target="_blank" rel="noopener noreferrer" className="alert-link">open it in a new tab</a> or <a href={googleDocsUrl} target="_blank" rel="noopener noreferrer" className="alert-link">view with Google Docs viewer</a>.
                    </Alert>
                </div>
            </>
        );
    };
    
    // Function to get direct PDF URL for uploads path
    const getDirectPdfUrl = (url) => {
        if (!url) return '';
        
        // Handle upload paths directly - this is the key fix
        if (url.startsWith('uploads/') || url.includes('/uploads/')) {
            // Extract just the path part
            const pathOnly = url.includes('/uploads/') 
                ? url.substring(url.indexOf('/uploads/'))
                : '/uploads/' + url.replace('uploads/', '');
                
            // Prepend the server base URL (not the API URL)
            return `${serverBaseUrl}${pathOnly}`;
        }
        
        // If URL is already absolute (starts with http or https), return it as is
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        // If URL is a relative path without leading slash, add it
        if (!url.startsWith('/')) {
            url = '/' + url;
        }
        
        // Use server base URL instead of window.location.origin
        return `${serverBaseUrl}${url}`;
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-4">
                <Alert variant="danger">
                    {error}
                </Alert>
                <Button 
                    variant="outline-primary" 
                    onClick={() => navigate(-1)}
                    className="d-flex align-items-center"
                >
                    <FaArrowLeft className="me-2" />
                    Back to Course
                </Button>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <Button 
                    variant="outline-primary" 
                    onClick={() => navigate(-1)}
                    className="d-flex align-items-center"
                >
                    <FaArrowLeft className="me-2" />
                    Back to {courseTitle ? courseTitle : "Course"}
                </Button>
            </div>

            <Card className="shadow-sm">
                <Card.Header className="bg-white py-3">
                    <div className="d-flex align-items-center">
                        <FaFileAlt className="text-primary me-3" size={24} />
                        <h4 className="mb-0">{documentData?.title || documentData?.pdf_title}</h4>
                    </div>
                </Card.Header>
                <Card.Body>
                    {(documentData?.description || documentData?.pdf_description) && (
                        <div className="mb-4">
                            <h5>Description</h5>
                            <p>{documentData?.description || documentData?.pdf_description}</p>
                        </div>
                    )}
                    
                    <div className="document-content bg-light p-3 rounded">
                        {renderPdfViewer()}
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default DocumentViewer;