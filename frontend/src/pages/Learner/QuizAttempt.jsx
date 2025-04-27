import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  ProgressBar,
  Badge,
  Modal
} from "react-bootstrap";
import {
  FaArrowLeft,
  FaClock,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaInfoCircle
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from '../../Api/axiosInstance';

const QuizAttempt = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizData, courseData, chapterData } = location.state || {};
  
  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Initialize quiz
  useEffect(() => {
    // Validate if we have quiz data
    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
      toast.error("Invalid quiz data");
      navigate(-1);
      return;
    }
    
    // Initialize selected answers
    const initialAnswers = {};
    quizData.questions.forEach((question, index) => {
      initialAnswers[index] = question.allowMultipleAnswers ? [] : null;
    });
    setSelectedAnswers(initialAnswers);
    
    // Initialize timer
    if (quizData.timeLimit && quizData.timeLimit > 0) {
      setTimeRemaining(quizData.timeLimit * 60); // Convert minutes to seconds
    }
  }, [quizData, navigate]);
  
  // Timer effect
  useEffect(() => {
    let timer;
    
    if (timeRemaining > 0 && !quizCompleted) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timeRemaining, quizCompleted]);
  
  // Handle time up
  const handleTimeUp = () => {
    toast.error("Time's up! Submitting your quiz...");
    handleSubmitQuiz();
  };
  
  // Format time remaining
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle answer selection
  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers(prev => {
      const question = quizData.questions[questionIndex];
      
      if (question.allowMultipleAnswers) {
        // For multiple-answer questions
        const currentSelections = [...(prev[questionIndex] || [])];
        
        if (currentSelections.includes(optionIndex)) {
          // If already selected, unselect it
          return {
            ...prev,
            [questionIndex]: currentSelections.filter(index => index !== optionIndex)
          };
        } else {
          // If not selected, add it
          return {
            ...prev,
            [questionIndex]: [...currentSelections, optionIndex]
          };
        }
      } else {
        // For single-answer questions
        return {
          ...prev,
          [questionIndex]: optionIndex
        };
      }
    });
  };
  
  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // Navigate to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    const currentAnswer = selectedAnswers[currentQuestionIndex];
    
    if (quizData.questions[currentQuestionIndex].allowMultipleAnswers) {
      return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    } else {
      return currentAnswer !== null && currentAnswer !== undefined;
    }
  };
  
  // Calculate number of questions answered
  const getAnsweredQuestionsCount = () => {
    return Object.values(selectedAnswers).filter(answer => {
      if (Array.isArray(answer)) {
        return answer.length > 0;
      }
      return answer !== null && answer !== undefined;
    }).length;
  };
  
  // Handle quiz submission
  const handleSubmitQuiz = async () => {
    try {
      setIsSubmitting(true);
      
      // Calculate score
      let correctAnswers = 0;
      
      quizData.questions.forEach((question, questionIndex) => {
        const userAnswer = selectedAnswers[questionIndex];
        
        if (question.allowMultipleAnswers) {
          // For multiple-answer questions
          if (!Array.isArray(userAnswer) || userAnswer.length === 0) {
            return; // Skip if not answered
          }
          
          // Check if user selected all correct options and only correct options
          const correctOptions = question.options
            .map((option, index) => option.isCorrect ? index : null)
            .filter(index => index !== null);
          
          const userSelected = [...userAnswer].sort();
          const correctSelected = [...correctOptions].sort();
          
          if (userSelected.length === correctSelected.length && 
              userSelected.every((value, index) => value === correctSelected[index])) {
            correctAnswers++;
          }
        } else {
          // For single-answer questions
          if (userAnswer === null || userAnswer === undefined) {
            return; // Skip if not answered
          }
          
          if (question.options[userAnswer].isCorrect) {
            correctAnswers++;
          }
        }
      });
      
      const totalQuestions = quizData.questions.length;
      const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
      const isPassed = scorePercentage >= quizData.passingScore;
      
      // Prepare result object
      const result = {
        quizId: quizData.id,
        quizTitle: quizData.title,
        totalQuestions,
        correctAnswers,
        scorePercentage,
        isPassed,
        completedAt: new Date().toISOString(),
        answers: selectedAnswers
      };
      
      // In a real app, we would save the result to the server here
      // For now, just simulate a server request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update state with results
      setQuizResult(result);
      setQuizCompleted(true);
      
      // Show appropriate toast
      if (isPassed) {
        toast.success(`Congratulations! You passed the quiz with ${scorePercentage}%`);
      } else {
        toast.error(`You scored ${scorePercentage}%. Minimum passing score is ${quizData.passingScore}%`);
      }
      
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle back to course
  const handleBackToCourse = () => {
    if (!quizCompleted && getAnsweredQuestionsCount() > 0) {
      setShowConfirmModal(true);
    } else {
      navigate(-1);
    }
  };
  
  // Current question
  const currentQuestion = quizData?.questions[currentQuestionIndex];
  
  // If quiz is completed, show results
  if (quizCompleted && quizResult) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom py-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">Quiz Results</h4>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => navigate(-1)}
                    className="d-flex align-items-center"
                  >
                    <FaArrowLeft className="me-2" /> Back to Course
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <h2 className="mb-3">{quizData.title}</h2>
                  <div className="d-inline-block position-relative">
                    <div 
                      className="position-relative" 
                      style={{ 
                        width: '150px', 
                        height: '150px', 
                        margin: '0 auto' 
                      }}
                    >
                      <div 
                        className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{ fontSize: '2.5rem', fontWeight: 'bold' }}
                      >
                        {quizResult.scorePercentage}%
                      </div>
                      <svg viewBox="0 0 36 36" className="position-absolute top-0 start-0 w-100 h-100" style={{ transform: 'rotate(-90deg)' }}>
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#eee"
                          strokeWidth="3"
                          strokeDasharray="100, 100"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={quizResult.isPassed ? "#28a745" : "#dc3545"}
                          strokeWidth="3"
                          strokeDasharray={`${quizResult.scorePercentage}, 100`}
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Badge 
                      bg={quizResult.isPassed ? "success" : "danger"} 
                      className="px-4 py-2 fs-6"
                    >
                      {quizResult.isPassed ? "PASSED" : "FAILED"}
                    </Badge>
                  </div>
                </div>
                
                <div className="results-details p-4 bg-light rounded-3 mb-4">
                  <Row className="text-center">
                    <Col sm={4} className="mb-3 mb-sm-0">
                      <div className="fw-bold fs-3">{quizResult.totalQuestions}</div>
                      <div className="text-muted">Total Questions</div>
                    </Col>
                    <Col sm={4} className="mb-3 mb-sm-0">
                      <div className="fw-bold fs-3">{quizResult.correctAnswers}</div>
                      <div className="text-muted">Correct Answers</div>
                    </Col>
                    <Col sm={4}>
                      <div className="fw-bold fs-3">{quizData.passingScore}%</div>
                      <div className="text-muted">Passing Score</div>
                    </Col>
                  </Row>
                </div>
                
                <Alert variant={quizResult.isPassed ? "success" : "danger"}>
                  <div className="d-flex align-items-center">
                    {quizResult.isPassed ? (
                      <FaCheck className="me-2 fs-4" />
                    ) : (
                      <FaTimes className="me-2 fs-4" />
                    )}
                    <div>
                      <strong>
                        {quizResult.isPassed
                          ? "Congratulations! You've passed the quiz."
                          : "You didn't meet the passing score for this quiz."}
                      </strong>
                      <div>
                        {quizResult.isPassed
                          ? "You can continue with the course materials."
                          : `The minimum passing score is ${quizData.passingScore}%. You can retake the quiz later.`}
                      </div>
                    </div>
                  </div>
                </Alert>
                
                <div className="mt-4 text-center">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={() => navigate(-1)}
                    className="px-5"
                  >
                    Continue Learning
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
  
  return (
    <Container fluid className="p-0">
      {/* Header */}
      <div className="w-100 py-3" style={{ 
        background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
        color: 'white'
      }}>
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <Button 
              variant="light" 
              className="d-flex align-items-center"
              onClick={handleBackToCourse}
              disabled={isSubmitting}
              style={{ 
                color: '#0062E6',
                fontWeight: '500',
                borderRadius: '50px',
                padding: '8px 16px',
                border: 'none',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
              }}
            >
              <FaArrowLeft className="me-2" /> Exit Quiz
            </Button>
            
            {quizData?.timeLimit > 0 && (
              <div className="d-flex align-items-center px-3 py-1 rounded-pill bg-white bg-opacity-25">
                <FaClock className="me-2" />
                <span className="fw-bold">{formatTimeRemaining()}</span>
              </div>
            )}
          </div>
        </Container>
      </div>
      
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-bottom py-3">
                <h5 className="mb-0">{quizData?.title}</h5>
                <div className="text-muted small">{getAnsweredQuestionsCount()} of {quizData?.questions.length} questions answered</div>
              </Card.Header>
              <Card.Body className="p-4">
                <ProgressBar 
                  now={(getAnsweredQuestionsCount() / quizData?.questions.length) * 100} 
                  className="mb-4"
                  style={{ height: '8px' }}
                />
                
                <Alert variant="info" className="d-flex mb-4">
                  <FaInfoCircle className="me-2 mt-1 flex-shrink-0" />
                  <div>
                    <strong>Quiz Instructions:</strong> 
                    <p className="mb-0">Read each question carefully and select the correct answer(s). You need to score at least {quizData?.passingScore}% to pass this quiz.</p>
                  </div>
                </Alert>
                
                {/* Question */}
                <div className="question-container">
                  <div className="question-number mb-3">
                    <Badge bg="primary" className="px-3 py-2">Question {currentQuestionIndex + 1} of {quizData?.questions.length}</Badge>
                  </div>
                  
                  <h4 className="mb-4">{currentQuestion?.text}</h4>
                  
                  <Form>
                    {currentQuestion?.options.map((option, optionIndex) => {
                      const isMultipleAnswer = currentQuestion.allowMultipleAnswers;
                      const isSelected = isMultipleAnswer 
                        ? selectedAnswers[currentQuestionIndex]?.includes(optionIndex)
                        : selectedAnswers[currentQuestionIndex] === optionIndex;
                      
                      return (
                        <Form.Check
                          key={optionIndex}
                          type={isMultipleAnswer ? "checkbox" : "radio"}
                          id={`option-${currentQuestionIndex}-${optionIndex}`}
                          name={`question-${currentQuestionIndex}`}
                          label={option.text}
                          checked={isSelected}
                          onChange={() => handleAnswerSelect(currentQuestionIndex, optionIndex)}
                          className="mb-3 p-3 border rounded"
                          style={{
                            backgroundColor: isSelected ? 'rgba(13, 110, 253, 0.05)' : 'transparent',
                            borderColor: isSelected ? '#0d6efd' : '#dee2e6',
                            transition: 'all 0.2s ease'
                          }}
                        />
                      );
                    })}
                  </Form>
                </div>
              </Card.Body>
              <Card.Footer className="bg-white py-3 px-4">
                <div className="d-flex justify-content-between">
                  <Button 
                    variant="light" 
                    onClick={handlePrevQuestion} 
                    disabled={currentQuestionIndex === 0 || isSubmitting}
                  >
                    Previous
                  </Button>
                  
                  <div>
                    {currentQuestionIndex === quizData?.questions.length - 1 ? (
                      <Button 
                        variant="primary" 
                        onClick={() => setShowConfirmModal(true)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <FaSpinner className="fa-spin me-2" /> Submitting...
                          </>
                        ) : (
                          "Submit Quiz"
                        )}
                      </Button>
                    ) : (
                      <Button 
                        variant="primary" 
                        onClick={handleNextQuestion}
                        disabled={isSubmitting}
                      >
                        Next
                      </Button>
                    )}
                  </div>
                </div>
              </Card.Footer>
            </Card>
            
            <div className="d-flex flex-wrap justify-content-center mb-5">
              {quizData?.questions.map((_, index) => {
                const isAnswered = Array.isArray(selectedAnswers[index]) 
                  ? selectedAnswers[index].length > 0 
                  : selectedAnswers[index] !== null && selectedAnswers[index] !== undefined;
                
                return (
                  <Button
                    key={index}
                    variant={isAnswered ? "primary" : "outline-secondary"}
                    className="question-nav-button me-2 mb-2"
                    onClick={() => setCurrentQuestionIndex(index)}
                    active={currentQuestionIndex === index}
                    style={{ width: '40px', height: '40px', padding: '0' }}
                  >
                    {index + 1}
                  </Button>
                );
              })}
            </div>
          </Col>
        </Row>
      </Container>
      
      {/* Confirmation Modal */}
      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {currentQuestionIndex === quizData?.questions.length - 1 
              ? "Submit Quiz" 
              : "Exit Quiz"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentQuestionIndex === quizData?.questions.length - 1 ? (
            <>
              <p>Are you sure you want to submit your quiz?</p>
              <div className="alert alert-warning">
                <div className="d-flex">
                  <FaInfoCircle className="me-2 mt-1 flex-shrink-0" />
                  <div>
                    <strong>Please note:</strong>
                    <ul className="mb-0 ps-3 mt-1">
                      <li>You have answered {getAnsweredQuestionsCount()} out of {quizData?.questions.length} questions.</li>
                      <li>Unanswered questions will be marked as incorrect.</li>
                      <li>You need to score at least {quizData?.passingScore}% to pass this quiz.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <p>Are you sure you want to exit the quiz?</p>
              <div className="alert alert-warning">
                <FaInfoCircle className="me-2" /> Your progress will be lost and you'll need to start over.
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowConfirmModal(false);
              if (currentQuestionIndex === quizData?.questions.length - 1) {
                handleSubmitQuiz();
              } else {
                navigate(-1);
              }
            }}
          >
            {currentQuestionIndex === quizData?.questions.length - 1 
              ? "Submit Quiz" 
              : "Exit Quiz"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default QuizAttempt; 