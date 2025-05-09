import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Spinner } from 'react-bootstrap';
import { FaFileAlt, FaArrowLeft } from 'react-icons/fa';

const DocumentViewer = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [documentData, setDocumentData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Set a static PDF located in the public folder
        const localPdf = {
            title: 'Sample PDF Document',
            description: 'This is a sample PDF file stored locally in the public folder.',
            url: '/react.pdf' // Make sure this file exists in public/sample.pdf
        };

        setDocumentData(localPdf);
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
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
                    Back to Course
                </Button>
            </div>

            <Card className="shadow-sm">
                <Card.Header className="bg-white py-3">
                    <div className="d-flex align-items-center">
                        <FaFileAlt className="text-primary me-3" size={24} />
                        <h4 className="mb-0">{documentData?.title}</h4>
                    </div>
                </Card.Header>
                <Card.Body>
                    {documentData?.description && (
                        <div className="mb-4">
                            <h5>Description</h5>
                            <p>{documentData?.description}</p>
                        </div>
                    )}

                    <div className="document-content bg-light p-3 rounded">
                        <iframe
                            src={documentData?.url}
                            title="PDF Document"
                            width="100%"
                            height="600px"
                            style={{ border: '1px solid #dee2e6', borderRadius: '0.375rem' }}
                        />
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default DocumentViewer;
