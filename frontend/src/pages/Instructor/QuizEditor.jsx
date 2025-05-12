import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
    Container,  Row,  Col,  Card,  Form,  Button,  Alert,  InputGroup,  ListGroup,  Badge,  Accordion,  Modal
} from "react-bootstrap";
import {  FaArrowLeft,   FaPlus,  FaTrash,  FaEdit,  FaCheck,  FaClock,  FaSave,  FaEye,  FaEyeSlash,  FaGripLines,  FaSpinner
} from "react-icons/fa";
import { toast } from "react-toastify";
import Courses_API from "../../Api/courseApi";
import { getQuiz, updateQuiz, createQuiz, patchQuiz } from "../../Api/quizApi";
import axiosInstance from "../../Api/axiosInstance";

const QuizEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { chapterId, courseId, quizId: existingQuizId, quizTitle: initialTitle, quizDescription: initialDesc } = location.state || {};
  
  // Quiz settings
  const [quizTitle, setQuizTitle] = useState(initialTitle || "");
  const [quizDescription, setQuizDescription] = useState(initialDesc || "");
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState(30);
  const [attempts, setAttempts] = useState(1);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quizId, setQuizId] = useState(existingQuizId || null);
  
  // Questions management
  const [questions, setQuestions] = useState([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState([{ text: "", isCorrect: true }, { text: "", isCorrect: false }]);
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(true);
  const [formError, setFormError] = useState(null);
  const [activeKeys, setActiveKeys] = useState([]);
  const [expandAll, setExpandAll] = useState(false);

  useEffect(() => {
    // Validate required parameters
    if (!chapterId || !courseId) {
      toast.error("Missing required information to edit quiz");
      navigate("/instructor/mycourses");
      return;
    }
    
    const fetchQuizData = async () => {
      try {
        // If we have a quizId, fetch the quiz data
        if (quizId) {
          setLoading(true);
          // Fetch the quiz data from the API
          const quizData = await getQuiz(quizId);
          // Set quiz settings
          setQuizTitle(quizData.title || "");
          setQuizDescription(quizData.description || "");
          setPassingScore(quizData.passing_score || 70);
          setTimeLimit(quizData.time_limit ? Math.floor(quizData.time_limit / 60) : 30); // Convert seconds to minutes
          setAttempts(quizData.max_attempts || 1);
          setIsPublished(quizData.isPublished || false);
          // Format questions if they exist
          if (quizData.questions && quizData.questions.length > 0) {
            const formattedQuestions = quizData.questions.map(q => ({
              id: q._id,
              text: q.question_text,
              options: q.options.map(opt => ({
                text: opt.text,
                isCorrect: opt.isCorrect
              })),
              points: q.points || 1,
              allowMultipleAnswers: q.options.filter(opt => opt.isCorrect).length > 1
            }));
            setQuestions(formattedQuestions);
          }
          setLoading(false);
        } else {
          // If no quizId, just use the initial values passed from the navigation
          setQuizTitle(initialTitle || "");
          setQuizDescription(initialDesc || "");
          setPassingScore(70); // Set default passing score to 70 for new quizzes
        }
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        toast.error("Failed to load quiz data. Please try again.");
        setLoading(false);
      }
    };
    fetchQuizData();
  }, [quizId, chapterId, courseId, navigate, initialTitle, initialDesc]);

  // Add useEffect to check authentication
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userString = localStorage.getItem("user");
    if (!token || !userString) {
      toast.error("You must be logged in to create or edit a quiz");
      navigate("/");
      return;
    }
    // Check if user is an instructor or admin
    try {
      const user = JSON.parse(userString);
      if (user.role !== "instructor" && user.role !== "admin") {
        toast.error("Only instructors or admins can create or edit quizzes");
        navigate("/");
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      toast.error("Invalid user data. Please log in again");
      navigate("/");
    }
  }, [navigate]);

  const handleAddQuestion = () => {
    setQuestionText("");
    setOptions([
      { text: "", isCorrect: true },  // Make first option correct by default
      { text: "", isCorrect: false }
    ]);
    setAllowMultipleAnswers(true); // Always set to true - no more toggling
    setEditingQuestionIndex(null);
    setFormError(null);
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (index) => {
    const question = questions[index];
    setQuestionText(question.text);
    setOptions(question.options);
    setAllowMultipleAnswers(true); // Always true regardless of previous value
    setEditingQuestionIndex(index);
    setFormError(null);
    setShowQuestionModal(true);
  };

  const handleDeleteQuestion = (index) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      setQuestions(questions.filter((_, i) => i !== index));
      toast.success("Question deleted");
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index].text = value;
    setOptions(newOptions);
  };

  const handleCorrectOptionChange = (index) => {
    const newOptions = [...options];
    newOptions[index].isCorrect = !newOptions[index].isCorrect;
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    if (options.length < 8) { // Increased limit to 8 options max
      setOptions([...options, { text: "", isCorrect: false }]);
    } else {
      toast.warning("Maximum of 8 options allowed");
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) { // Keep at least 2 options
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    } else {
      toast.warning("A question must have at least 2 options");
    }
  };

  const handleSaveQuestion = () => {
    // Clear previous error
    setFormError(null);
    
    // Validate question form
    if (!questionText.trim()) {
      toast.error("Question text is required");
      setFormError("Please enter a question");
      return;
    }
    
    // Check if any options have empty text
    const emptyOptions = options.filter(option => !option.text.trim());
    if (emptyOptions.length > 0) {
      toast.error("Please enter text for all options");
      setFormError("Please enter text for all options");
      return;
    }
    
    // Check at least 2 options have text
    const validOptions = options.filter(option => option.text.trim() !== "");
    if (validOptions.length < 2) {
      toast.error("At least 2 options are required");
      setFormError("At least 2 options with text are required");
      return;
    }
    
    // Check that at least one option is marked as correct
    const hasCorrectOption = options.some(option => option.isCorrect);
    if (!hasCorrectOption) {
      toast.error("Please tick at least one answer as correct");
      setFormError("Please tick at least one answer as correct");
      return;
    }
    
    // Filter out empty options
    const filteredOptions = options.filter(option => option.text.trim() !== "").map(option => ({
      text: option.text,
      isCorrect: option.isCorrect || false
    }));
    
    // Format the question for our UI
    const newQuestion = { id: editingQuestionIndex !== null && questions[editingQuestionIndex]?.id ? questions[editingQuestionIndex].id : `q_${Date.now()}`, text: questionText, options: filteredOptions, allowMultipleAnswers: true, points: 1 };
    
    let updatedQuestions;
    if (editingQuestionIndex !== null) {
      // Update existing question
      updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = newQuestion;
    } else {
      // Add new question
      updatedQuestions = [...questions, newQuestion];
    }
    
    setQuestions(updatedQuestions);
    setShowQuestionModal(false);
    toast.success(editingQuestionIndex !== null ? "Question updated" : "Question added");
  };

  // Handle drag and drop reordering of questions
  const handleDragEnd = (result) => {
    // Clean up body class regardless of result
    document.body.classList.remove('dragging-active');
    
    if (!result.destination) return; // Dropped outside the list
    
    const reorderedQuestions = Array.from(questions);
    const [movedQuestion] = reorderedQuestions.splice(result.source.index, 1);
    reorderedQuestions.splice(result.destination.index, 0, movedQuestion);
    
    setQuestions(reorderedQuestions);
    toast.success("Questions reordered");
  };
  
  // Called when drag starts
  const handleDragStart = () => {
    // Focus management for accessibility
    document.body.classList.add('dragging-active');
  };
  
  // Called when drag is finished (even if no destination)
  const handleDragUpdate = (update) => {
    if (!update.destination) {
      document.body.classList.remove('dragging-active');
    }
  };

  // Control how the dragged item looks during dragging
  const getDragStyle = (isDragging, draggableStyle) => {
    // When not dragging, we don't need to add any styles
    if (!isDragging) {
      return {};
    }
    
    // When dragging, properly position the element
    return {
      ...draggableStyle,
      userSelect: 'none',
      boxShadow: '0 5px 15px rgba(0,0,0,0.15)',
      opacity: 0.9,
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      pointerEvents: 'none', // Prevents issues with hover events during drag
    };
  };

  // Update passing score handler
  const handlePassingScoreChange = (e) => {
    const value = e.target.value;
    // Allow empty value for clearing
    if (value === '') {
      setPassingScore(70); // Set to 70 when cleared
      return;
    }
    // Convert to number and validate
    const numScore = parseInt(value);
    if (!isNaN(numScore)) {
      if (numScore >= 0 && numScore <= 100) {
        setPassingScore(numScore);
      } else {
        // If out of range, set to closest valid value
        setPassingScore(numScore < 0 ? 0 : 100);
      }
    }
  };

  // Format passing score for display
  const formatPassingScore = (score) => {
    if (score === '') return '70'; // Show 70 when empty
    return score === 0 ? '0' : score;
  };

  // Update the handleSaveQuiz function to include passing score
  const handleSaveQuiz = async () => {
    try {
      setLoading(true);
      setFormError(null);

      // Validate quiz data
      if (!quizTitle.trim()) {
        toast.error("Quiz title is required");
        setFormError("Quiz title is required");
        setLoading(false);
        return;
      }

      if (questions.length === 0) {
        toast.error("At least one question is required");
        setFormError("At least one question is required");
        setLoading(false);
        return;
      }

      // Prepare quiz data with passing score
      const quizData = {
        title: quizTitle.trim(),
        description: quizDescription.trim(),
        questions: questions.map(q => ({
          question_text: q.text,
          options: q.options,
          points: q.points || 1
        })),
        passing_score: passingScore === '' ? 70 : passingScore, // Default to 70 if empty
        time_limit: timeLimit * 60, // Convert to seconds
        max_attempts: attempts,
        isPublished: isPublished,
        chapterId: chapterId,
        courseId: courseId
      };

      let response;
      if (quizId) {
        response = await updateQuiz(quizId, quizData);
        toast.success("Quiz updated successfully");
      } else {
        response = await createQuiz(quizData);
        setQuizId(response._id);
        toast.success("Quiz created successfully");
      }

      // Instead of navigating, just show success message
      // The user can use the "Back to Course" button when they want to return
      
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast.error(error.response?.data?.message || "Failed to save quiz");
      setFormError("Failed to save quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async () => {
    try {
      setLoading(true);
      
      // Update just the published status
      await patchQuiz(quizId, {
        isPublished: !isPublished
      });
      
      setIsPublished(!isPublished);
      toast.success(isPublished ? "Quiz unpublished" : "Quiz published successfully!");
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Failed to update publish status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCourse = () => {
    if (questions.length > 0 && !window.confirm("Are you sure you want to go back? Any unsaved changes will be lost.")) {
      return;
    }
    navigate(-1);
  };

  // Modify the toggleExpandAllQuestions function
  const toggleExpandAllQuestions = () => {
    const newExpandAll = !expandAll;
    setExpandAll(newExpandAll);
    
    if (newExpandAll) {
      // When expanding all, set all keys as active
      setActiveKeys(questions.map((_, i) => i.toString()));
    } else {
      // When collapsing all, clear all active keys
      setActiveKeys([]);
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (questionIndex, optionIndex) => {
    const question = questions[questionIndex];
    
    if (question.allowMultipleAnswers) {
      // For multiple-answer questions, toggle the selected option
      const newOptions = [...question.options];
      newOptions[optionIndex].isCorrect = !newOptions[optionIndex].isCorrect;
      
      // Update the question with new options
      const updatedQuestions = [...questions];
      updatedQuestions[questionIndex].options = newOptions;
      setQuestions(updatedQuestions);
    } else {
      // For single-answer questions, set only the selected option as correct
      const newOptions = question.options.map((option, i) => ({
        ...option,
        isCorrect: i === optionIndex
      }));
      
      // Update the question with new options
      const updatedQuestions = [...questions];
      updatedQuestions[questionIndex].options = newOptions;
      setQuestions(updatedQuestions);
    }
  };

  return (
    <Container fluid className="p-0">
      {/* Header */}
      <div className="w-100 mb-4" style={{ background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)', padding: '30px 0', color: 'white', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)' }}>
        <Container>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <div className="mb-3 mb-md-0">
              <Button 
                variant="light" 
                className="d-flex align-items-center mb-3"
                onClick={handleBackToCourse}
                disabled={loading}
                style={{ color: '#0062E6', fontWeight: '500', borderRadius: '50px', padding: '8px 16px', border: 'none', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)' }}
              >
                <FaArrowLeft className="me-2" /> Back to Course
              </Button>
              <h1 className="fw-bold mb-0" style={{ fontSize: 'calc(1.2rem + 0.8vw)' }}>Quiz Editor</h1>
              <p className="mb-0 opacity-75">Create and manage your quiz questions</p>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant={isPublished ? "warning" : "success"}
                className="d-flex align-items-center"
                onClick={handlePublishToggle}
                disabled={loading || questions.length === 0}
                style={{ borderRadius: '50px', padding: '10px 20px', fontWeight: '600' }}
              >
                {loading ? (
                  <FaSpinner className="fa-spin me-2" />
                ) : isPublished ? (
                  <FaEyeSlash className="me-2" />
                ) : (
                  <FaEye className="me-2" />
                )}
                {isPublished ? "Unpublish" : "Publish"}
              </Button>
              
              <Button 
                variant="light" 
                className="d-flex align-items-center"
                onClick={handleSaveQuiz}
                disabled={loading || questions.length === 0}
                style={{ color: '#0062E6', fontWeight: '600', borderRadius: '50px', padding: '10px 20px', border: 'none', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)' }}
              >
                {loading ? <FaSpinner className="fa-spin me-2" /> : <FaSave className="me-2" />}
                Save Quiz
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container className="mb-5">
        <Row className="g-4">
          {/* Quiz settings column */}
          <Col lg={4} className="mb-4">
            <Card className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
              <Card.Header className="bg-white py-3 border-bottom">
                <h5 className="mb-0 fw-bold">Quiz Settings</h5>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Quiz Title</Form.Label>
                    <Form.Control
                      type="text"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="Enter quiz title"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={quizDescription}
                      onChange={(e) => setQuizDescription(e.target.value)}
                      placeholder="Enter quiz description"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Group>
                  
                  <hr className="my-4" />
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Passing Score (%)</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        min="0"
                        max="100"
                        value={formatPassingScore(passingScore)}
                        onChange={handlePassingScoreChange}
                        style={{ borderRadius: '8px 0 0 8px' }}
                        placeholder="Enter passing score (0-100)"
                      />
                      <InputGroup.Text style={{ background: '#f8f9fa' }}>%</InputGroup.Text>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Enter a value between 0 and 100 (default is 70%)
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Time Limit (minutes)</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        min="1"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 0))}
                        style={{ borderRadius: '8px 0 0 8px' }}
                      />
                      <InputGroup.Text style={{ background: '#f8f9fa' }}>min</InputGroup.Text>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Set to 0 for no time limit
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Maximum Allowed Attempts</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        min="1"
                        value={attempts}
                        onChange={(e) => setAttempts(Math.max(1, parseInt(e.target.value) || 0))}
                        style={{ borderRadius: '8px 0 0 8px' }}
                      />
                      <InputGroup.Text style={{ background: '#f8f9fa' }}>attempt(s)</InputGroup.Text>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      How many times students can attempt this quiz
                    </Form.Text>
                  </Form.Group>
                  
                  {isPublished && (
                    <Alert variant="info" className="mt-3 mb-0">
                      <small>This quiz is currently visible to students.</small>
                    </Alert>
                  )}
                </Form>
              </Card.Body>
            </Card>
          </Col>
          
          {/* Questions column */}
          <Col lg={8}>
            <Card className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
              <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">Questions</h5>
                <div className="d-flex gap-2">
                  {questions.length > 0 && (
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="d-flex align-items-center me-2"
                      onClick={toggleExpandAllQuestions}
                      style={{ borderRadius: '50px', padding: '8px 16px' }}
                    >
                      {expandAll ? 'Collapse All' : 'Expand All'}
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    className="d-flex align-items-center"
                    onClick={handleAddQuestion}
                    style={{ borderRadius: '50px', padding: '8px 16px' }}
                  >
                    <FaPlus className="me-2" /> Add Question
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                {questions.length === 0 ? (
                  <div className="text-center py-5">
                    <div 
                      className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '70px', height: '70px', background: 'rgba(0, 98, 230, 0.1)' }}
                    >
                      <FaPlus size={24} color="#0062E6" />
                    </div>
                    <h5>No questions added yet</h5>
                    <p className="text-muted">Click the "Add Question" button to get started</p>
                  </div>
                ) : (
                  <DragDropContext 
                    onDragEnd={handleDragEnd}
                    onDragStart={handleDragStart}
                    onDragUpdate={handleDragUpdate}
                  >
                    <Droppable droppableId="questions" type="QUESTION">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="questions-container"
                        >
                          <Accordion 
                            activeKey={activeKeys}
                            alwaysOpen={true}
                          >
                            {questions.map((question, index) => (
                              <Draggable key={question.id} draggableId={question.id} index={index}>
                                {(provided, snapshot) => (
                                  <Card 
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="mb-3 border shadow-sm" 
                                    style={{
                                      ...provided.draggableProps.style,
                                      borderRadius: '8px',
                                      background: snapshot.isDragging ? '#ffffff' : 'transparent',
                                      boxShadow: snapshot.isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
                                      transform: snapshot.isDragging ? provided.draggableProps.style.transform : 'translate(0, 0)',
                                      marginLeft: snapshot.isDragging ? '0' : undefined,
                                    }}
                                  >
                                    <Accordion.Item eventKey={index.toString()} className="border-0">
                                      <Accordion.Header 
                                        onClick={(e) => {
                                          // Handle toggling individual items
                                          const key = index.toString();
                                          if (activeKeys.includes(key)) {
                                            // If it's already open, close it
                                            setActiveKeys(activeKeys.filter(k => k !== key));
                                          } else {
                                            // If it's closed, open it
                                            setActiveKeys([...activeKeys, key]);
                                          }
                                          
                                          // Set expandAll to false if not all items are open,
                                          // or true if all items are now open
                                          if (activeKeys.length + 1 === questions.length && !activeKeys.includes(key)) {
                                            setExpandAll(true);
                                          } else {
                                            setExpandAll(false);
                                          }
                                        }}
                                      >
                                        <div className="d-flex align-items-center w-100 pe-3">
                                          <div 
                                            {...provided.dragHandleProps}
                                            className="drag-handle me-3 text-muted"
                                            style={{ touchAction: 'none' }}
                                          >
                                            <FaGripLines />
                                          </div>
                                          <div 
                                            className="question-number me-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0062E6', color: 'white', fontSize: '0.9rem', fontWeight: '600' }}
                                          >
                                            {index + 1}
                                          </div>
                                          <div className="question-preview flex-grow-1 text-truncate" style={{ maxWidth: '60%' }}>
                                            {question.text}
                                          </div>
                                          <div className="ms-auto d-flex">
                                            <div
                                              className="me-2 d-flex align-items-center justify-content-center"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditQuestion(index);
                                              }}
                                              style={{ width: '32px', height: '32px', borderRadius: '50%', padding: '0', cursor: 'pointer', border: '1px solid #0d6efd', color: '#0d6efd', backgroundColor: 'white' }}
                                              role="button"
                                              aria-label="Edit question"
                                            >
                                              <FaEdit />
                                            </div>
                                            <div
                                              className="d-flex align-items-center justify-content-center"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteQuestion(index);
                                              }}
                                              style={{ width: '32px', height: '32px', borderRadius: '50%', padding: '0', cursor: 'pointer', border: '1px solid #dc3545', color: '#dc3545', backgroundColor: 'white' }}
                                              role="button"
                                              aria-label="Delete question"
                                            >
                                              <FaTrash />
                                            </div>
                                          </div>
                                        </div>
                                      </Accordion.Header>
                                      <Accordion.Body className="pt-0">
                                        <div className="options-display mt-3">
                                          <div className="options-grid">
                                            {question.options.map((option, optionIndex) => (
                                              <div 
                                                key={optionIndex} 
                                                className={`option-box p-3 ${option.isCorrect ? 'correct-option' : ''}`}
                                              >
                                                <div className="d-flex align-items-center">
                                                  <div 
                                                    className={`option-marker me-2 d-flex align-items-center justify-content-center text-white ${option.isCorrect ? 'bg-success' : 'bg-secondary'}`}
                                                    style={{ width: '25px', height: '25px', borderRadius: '50%', fontSize: '0.75rem' }}
                                                  >
                                                    {String.fromCharCode(65 + optionIndex)}
                                                  </div>
                                                  <div>{option.text}</div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        <small className="text-muted mt-3 d-block">
                                          {question.allowMultipleAnswers ? 
                                            <Badge bg="info" className="me-2">Multiple answers allowed</Badge> : 
                                            <Badge bg="primary">Single answer</Badge>
                                          }
                                        </small>
                                      </Accordion.Body>
                                    </Accordion.Item>
                                  </Card>
                                )}
                              </Draggable>
                            ))}
                          </Accordion>
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </Card.Body>
              {questions.length > 0 && (
                <Card.Footer className="bg-white border-top py-3">
                  <div>
                    <Badge bg="primary" className="py-2 px-3 rounded-pill">
                      {questions.length} question{questions.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </Card.Footer>
              )}
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Question Modal */}
      <Modal
        show={showQuestionModal}
        onHide={() => setShowQuestionModal(false)}
        centered
        backdrop="static"
        size="lg"
      >
        <Modal.Header closeButton style={{ background: '#f8f9fa' }}>
          <Modal.Title>{editingQuestionIndex !== null ? 'Edit Question' : 'Add New Question'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {formError && (
              <Alert variant="danger" className="mb-3">
                <strong>Error:</strong> {formError}
              </Alert>
            )}
            <Form.Group className="mb-4">
              <Form.Label>Question Text</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter your question here"
                style={{ borderRadius: '8px' }}
                isInvalid={formError === "Please enter a question"}
              />
              {formError === "Please enter a question" && (
                <Form.Control.Feedback type="invalid">
                  Question text is required
                </Form.Control.Feedback>
              )}
            </Form.Group>
            <div className="mb-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Answer Options</h5>
            </div>
            {options.map((option, index) => (
              <Form.Group key={index} className="mb-3 d-flex align-items-start">
                <div className="me-2" style={{ marginTop: '10px' }}>
                  <Form.Check
                    type="checkbox" // Always checkbox since we're always allowing multiple answers
                    name="correctOption"
                    id={`option-${index}`}
                    checked={option.isCorrect}
                    onChange={() => handleCorrectOptionChange(index)}
                    isInvalid={formError === "Please tick at least one answer as correct"}
                  />
                </div>
                <div className="flex-grow-1">
                  <InputGroup hasValidation>
                    <InputGroup.Text style={{ background: '#f8f9fa' }}>
                      {String.fromCharCode(65 + index)}
                    </InputGroup.Text>
                    <Form.Control
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Enter option ${String.fromCharCode(65 + index)}`}
                      isInvalid={formError === "Please enter text for all options" && !option.text.trim()}
                    />
                    {options.length > 2 && (
                      <Button 
                        variant="outline-danger" 
                        onClick={() => handleRemoveOption(index)}
                        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                      >
                        <FaTrash size={14} />
                      </Button>
                    )}
                    {formError === "Please enter text for all options" && !option.text.trim() && (
                      <Form.Control.Feedback type="invalid">
                        Option text is required
                      </Form.Control.Feedback>
                    )}
                  </InputGroup>
                </div>
              </Form.Group>
            ))}
            <div className="text-center mt-4">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleAddOption}
                className="px-4"
                disabled={options.length >= 8}
              >
                <FaPlus className="me-2" /> Add Option
              </Button>
              {options.length >= 8 && (
                <div className="text-muted mt-2 small">Maximum of 8 options reached</div>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ background: '#f8f9fa' }}>
          <Button 
            variant="light" 
            onClick={() => setShowQuestionModal(false)}
            style={{ borderRadius: '50px', padding: '8px 16px' }}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveQuestion}
            style={{ borderRadius: '50px', padding: '8px 16px' }}
          >
            {editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx="true">{`
        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 12px;
        }
        @media (max-width: 768px) {
          .options-grid {
            grid-template-columns: 1fr;
          }
        }
        .option-box {
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #dee2e6;
          transition: all 0.2s ease;
        }
        .correct-option {
          background: rgba(40, 167, 69, 0.1);
          border-color: rgba(40, 167, 69, 0.2);
          box-shadow: 0 0 0 1px rgba(40, 167, 69, 0.2);
        }
        .drag-handle {
          cursor: grab;
          transition: all 0.2s ease;
          width: 24px;
          height: 24px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .drag-handle:active {
          cursor: grabbing;
          transform: scale(1.1);
          color: #0062E6;
        }
        @media (hover: hover) {
          .drag-handle:hover {
            transform: scale(1.1);
            color: #0062E6;
          }
        }
        /* Fix for DnD positioning */
        .questions-container [data-rbd-draggable-context-id] {
          margin-bottom: 12px !important;
        }
        .questions-container [data-rbd-draggable-context-id][data-rbd-draggable-id] {
          transition: none !important;
        }
        .questions-container [data-rbd-placeholder-context-id] {
          margin-bottom: 12px !important;
          min-height: 50px;
          background-color: rgba(0, 98, 230, 0.05);
          border-radius: 8px;
          border: 2px dashed rgba(0, 98, 230, 0.3);
        }
        /* Global drag effect */
        body.dragging-active {
          cursor: grabbing !important;
        }
        body.dragging-active * {
          cursor: grabbing !important;
        }
      `}</style>
      
      {/* Additional styles for sticky elements */}
      <style jsx="true">{`
        /* Make Quiz Settings column sticky */
        @media (min-width: 992px) {
          .col-lg-4 .card {
            position: sticky;
            top: 20px;
          }
        }
        /* Make Questions header sticky */
        .col-lg-8 .card-header {
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        /* Add scroll behavior to Questions content */
        .col-lg-8 .card-body {
          max-height: calc(100vh - 200px);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #ced4da transparent;
        }
        /* Style scrollbar for WebKit browsers */
        .col-lg-8 .card-body::-webkit-scrollbar {
          width: 8px;
        }
        .col-lg-8 .card-body::-webkit-scrollbar-track {
          background: transparent;
        }
        .col-lg-8 .card-body::-webkit-scrollbar-thumb {
          background-color: #ced4da;
          border-radius: 8px;
          border: 2px solid #ffffff;
        }
        .col-lg-8 .card-body::-webkit-scrollbar-thumb:hover {
          background-color: #adb5bd;
        }
        /* Enhance question text area visibility */
        .modal-body textarea {
          border: 1px solid #ced4da;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
          font-size: 1rem;
        }
      `}</style>
    </Container>
  );
};

export default QuizEditor; 