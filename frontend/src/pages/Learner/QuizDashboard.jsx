import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaInfoCircle, FaClock, FaListOl } from 'react-icons/fa';
import axiosInstance from '../../Api/axiosInstance';
import Assessment_API from '../../Api/assessmentApi';

const QuizDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [quizData, setQuizData] = useState(null);
  const [previousAttempts, setPreviousAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [chapterId, setChapterId] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(0);
  
  useEffect(() => {
    const loadQuizData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let quizDataFromState = null;
        
        // Try to get quiz data from location state
        if (location.state?.quizData) {
          console.log("Using quiz data from location state:", location.state);
          quizDataFromState = location.state.quizData;
          setCourseId(location.state.courseId);
          setChapterId(location.state.chapterId);
          setCourseTitle(location.state.courseTitle || "");
          setQuizData(quizDataFromState);
        } else {
          // If no state, try to fetch directly using the ID
          console.log("Fetching quiz data for ID:", id);
          try {
            const response = await axiosInstance.get(`/chapter-content/${id}`);
            console.log("Quiz content response:", response.data);
            
            if (response.data && response.data.content_type_ref === 'Assessment') {
              quizDataFromState = {
                ...response.data.contentDetails,
                contentId: response.data.contentDetails._id,
                id: response.data._id
              };
              setQuizData(quizDataFromState);
              
              // Set course and chapter ID
              setCourseId(response.data.course_id);
              setChapterId(response.data.chapter_id);
            } else {
              throw new Error('Invalid quiz data');
            }
          } catch (err) {
            console.error("Error fetching quiz data:", err);
            setError('Failed to load quiz data. Please try again.');
            setLoading(false);
            return;
          }
        }
        
        // Fetch previous attempts
        if (quizDataFromState && courseId && chapterId) {
          try {
            const contentId = quizDataFromState.contentId || quizDataFromState._id;
            console.log("Fetching attempts for quiz:", contentId);
            
            const attemptResult = await Assessment_API.getUserAttempts(
              contentId,
              courseId,
              chapterId
            );
            
            console.log("Previous attempts:", attemptResult);
            
            if (attemptResult && attemptResult.attempts) {
              // Sort attempts by date (newest first)
              const sortedAttempts = [...attemptResult.attempts].sort(
                (a, b) => new Date(b.date_completed || b.createdAt) - new Date(a.date_completed || a.createdAt)
              );
              
              setPreviousAttempts(sortedAttempts);
              
              // Calculate attempts remaining
              const maxAttempts = attemptResult.assessment?.max_attempts || 
                               quizDataFromState.attempts || 
                               quizDataFromState.max_attempts || 1;
                               
              const completedAttempts = sortedAttempts.filter(a => a.completed).length;
              setAttemptsRemaining(Math.max(0, maxAttempts - completedAttempts));
            }
          } catch (err) {
            console.error("Error fetching attempts:", err);
            // Non-critical error, continue
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error in loadQuizData:", err);
        setError('An error occurred while loading quiz data.');
        setLoading(false);
      }
    };
    
    loadQuizData();
  }, [id, location, courseId, chapterId]);
  
  const handleStartQuiz = () => {
    navigate(`/quiz-attempt/${id}`, {
      state: {
        quizData,
        courseId,
        chapterId,
        courseTitle
      }
    });
  };
  
  const handleBackToCourse = () => {
    navigate(-1);
  };
  
  // Format the time value from seconds to minutes
  const formatTimeLimit = (timeValue) => {
    if (!timeValue) return "No time limit";
    
    // Convert seconds to minutes
    const minutes = Math.round(parseInt(timeValue) / 60);
    return `${minutes} min`;
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
          onClick={handleBackToCourse}
          className="d-flex align-items-center"
        >
          <FaArrowLeft className="me-2" /> Back to Course
        </Button>
      </Container>
    );
  }

  if (!quizData) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          Quiz data could not be loaded properly.
        </Alert>
        <Button 
          variant="outline-primary" 
          onClick={handleBackToCourse}
          className="d-flex align-items-center"
        >
          <FaArrowLeft className="me-2" /> Back to Course
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        <Col xs={12} className="mb-4">
          <Card className="border-0 shadow-sm" style={{
            background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
            color: 'white'
          }}>
            <Card.Body className="py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h2 className="mb-0">Quiz Dashboard</h2>
                <Button 
                  variant="light" 
                  onClick={handleBackToCourse}
                  className="d-flex align-items-center"
                  style={{ 
                    color: '#0062E6',
                    fontWeight: '500',
                    borderRadius: '50px',
                    padding: '8px 16px',
                    border: 'none',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <FaArrowLeft className="me-2" /> {courseTitle ? `Back to ${courseTitle}` : 'Back to Course'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <h3 className="mb-3">{quizData.title}</h3>
              <p className="text-muted mb-4">
                {quizData.description || "Test your knowledge with this quiz."}
              </p>
              
              <Row className="mb-4">
                <Col sm={4} className="mb-3 mb-sm-0">
                  <Card className="text-center h-100 border-0 bg-light">
                    <Card.Body>
                      <h1 className="display-4 fw-bold mb-0">{attemptsRemaining}</h1>
                      <p className="text-muted">Attempts Remaining</p>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col sm={4} className="mb-3 mb-sm-0">
                  <Card className="text-center h-100 border-0 bg-light">
                    <Card.Body>
                      <h1 className="display-4 fw-bold mb-0">{quizData.questions?.length || 0}</h1>
                      <p className="text-muted">Total Questions</p>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col sm={4}>
                  <Card className="text-center h-100 border-0 bg-light">
                    <Card.Body>
                      <h1 className="display-4 fw-bold mb-0">{quizData.passingScore || quizData.passing_score || 70}%</h1>
                      <p className="text-muted">Passing Score</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <Alert variant="info" className="d-flex mb-4">
                <FaInfoCircle className="me-2 mt-1 flex-shrink-0" />
                <div>
                  <p className="mb-2 fw-bold">Quiz Information:</p>
                  <ul className="mb-0">
                    <li>This quiz contains {quizData.questions?.length || 0} questions.</li>
                    <li>Time limit: {formatTimeLimit(quizData.timeLimit)}</li>
                    <li>You need {quizData.passingScore || quizData.passing_score || 70}% to pass.</li>
                    <li>You have {attemptsRemaining} attempt(s) remaining.</li>
                  </ul>
                </div>
              </Alert>
              
              {attemptsRemaining > 0 ? (
                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={handleStartQuiz}
                    style={{
                      background: "linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)",
                      border: "none",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.12)",
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.opacity = "0.9";
                      e.target.style.boxShadow = "0 6px 8px rgba(0, 0, 0, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = "1";
                      e.target.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.12)";
                    }}
                  >
                    Start Quiz
                  </Button>
                </div>
              ) : (
                <Alert variant="warning">
                  <FaInfoCircle className="me-2" /> You have used all your attempts for this quiz.
                </Alert>
              )}
            </Card.Body>
          </Card>
          
          {previousAttempts.length > 0 && (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white py-3">
                <h5 className="mb-0">Previous Attempts</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive className="mb-0">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Time Taken</th>
                      <th>Correct Answers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previousAttempts.map((attempt, index) => {
                      // Calculate correct answers
                      const totalQuestions = quizData.questions?.length || 0;
                      const scoreDecimal = attempt.score / 100;
                      const correctAnswers = Math.round(totalQuestions * scoreDecimal);
                      
                      // Format time taken
                      const timeTakenSeconds = attempt.timeTaken || 0;
                      const minutes = Math.floor(timeTakenSeconds / 60);
                      const seconds = timeTakenSeconds % 60;
                      const timeTakenFormatted = minutes > 0 
                        ? `${minutes}m ${seconds}s` 
                        : `${seconds}s`;
                      
                      return (
                        <tr key={attempt._id}>
                          <td>{new Date(attempt.date_completed || attempt.createdAt).toLocaleString()}</td>
                          <td>{attempt.score}%</td>
                          <td>
                            <Badge bg={attempt.passed ? "success" : "danger"}>
                              {attempt.passed ? "Passed" : "Failed"}
                            </Badge>
                          </td>
                          <td>{timeTakenFormatted}</td>
                          <td>{correctAnswers} / {totalQuestions}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default QuizDashboard; 