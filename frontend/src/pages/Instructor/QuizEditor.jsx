import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  InputGroup,
  ListGroup,
  Badge,
  Accordion,
  Modal
} from "react-bootstrap";
import {
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCheck,
  FaClock,
  FaSave,
  FaEye,
  FaEyeSlash,
  FaGripLines,
  FaSpinner
} from "react-icons/fa";
import { toast } from "react-toastify";
import Courses_API from "../../Api/courseApi";

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
  const [options, setOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false }
  ]);
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);
  // Track the active accordion item
  const [activeKeys, setActiveKeys] = useState([]);
  // New state to track if we're in "expand all" mode
  const [expandAll, setExpandAll] = useState(false);

  // Generate storage key based on quiz or chapter ID
  const getStorageKey = () => {
    if (quizId) return `quiz_data_${quizId}`;
    return `quiz_draft_${chapterId}`;
  };

  // Save quiz data to localStorage
  const saveQuizToLocalStorage = (data) => {
    try {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(data));
      
      // Also update the quiz in course content if it exists
      if (data.id && data.courseId) {
        const chapterStorageKey = `course_content_${data.courseId}`;
        const courseContent = localStorage.getItem(chapterStorageKey);
        
        if (courseContent) {
          const parsedContent = JSON.parse(courseContent);
          
          // Find the chapter
          const chapterIndex = parsedContent.findIndex(ch => ch.id === data.chapterId);
          
          if (chapterIndex !== -1) {
            // Find the quiz in the chapter items
            const quizIndex = parsedContent[chapterIndex].items.findIndex(
              item => item.id === data.id && item.type === 'quiz'
            );
            
            const quizData = {
              id: data.id,
              title: data.title,
              description: data.description,
              passingScore: data.passingScore,
              timeLimit: data.timeLimit,
              attempts: data.attempts,
              isPublished: data.isPublished,
              questions: data.questions,
              type: "quiz",
              order: Date.now(),
              chapterId: data.chapterId,
              courseId: data.courseId
            };
            
            if (quizIndex !== -1) {
              // Update existing quiz
              parsedContent[chapterIndex].items[quizIndex] = {
                ...parsedContent[chapterIndex].items[quizIndex],
                ...quizData
              };
            } else {
              // Add new quiz to end of chapter items
              parsedContent[chapterIndex].items.push(quizData);
            }
            
            // Save updated content back to localStorage
            localStorage.setItem(chapterStorageKey, JSON.stringify(parsedContent));
          }
        }
      }
      
      console.log("Quiz data saved to localStorage");
    } catch (error) {
      console.error("Error saving quiz data to localStorage:", error);
    }
  };

  // Load quiz data from localStorage
  const loadQuizFromLocalStorage = () => {
    try {
      const storageKey = getStorageKey();
      const savedData = localStorage.getItem(storageKey);
      return savedData ? JSON.parse(savedData) : null;
    } catch (error) {
      console.error("Error loading quiz data from localStorage:", error);
      return null;
    }
  };

  useEffect(() => {
    // Validate required parameters
    if (!chapterId || !courseId) {
      toast.error("Missing required information to create quiz");
      navigate("/instructor/mycourses");
      return;
    }
    
    // Try to load from localStorage first
    const savedQuiz = loadQuizFromLocalStorage();
    
    if (savedQuiz && (existingQuizId || (!existingQuizId && savedQuiz.id && savedQuiz.isBeingEdited))) {
      console.log("Loading quiz data from localStorage");
      
      // Set quiz settings
      setQuizTitle(savedQuiz.title || initialTitle || "");
      setQuizDescription(savedQuiz.description || initialDesc || "");
      setPassingScore(savedQuiz.passingScore || 70);
      setTimeLimit(savedQuiz.timeLimit || 30);
      setAttempts(savedQuiz.attempts || 1);
      setIsPublished(savedQuiz.isPublished || false);
      setQuizId(savedQuiz.id || existingQuizId || null);
      
      // Set questions
      if (savedQuiz.questions && savedQuiz.questions.length > 0) {
        setQuestions(savedQuiz.questions);
      }
      
      return;
    }
    
    // If no data in localStorage or not editing an existing quiz, create new quiz
    if (existingQuizId) {
      // Fetch existing quiz data from the course content in localStorage
      console.log("Using existing quiz ID:", existingQuizId);
      
      try {
        // First check if the quiz exists in the course content
        const chapterStorageKey = `course_content_${courseId}`;
        const courseContent = localStorage.getItem(chapterStorageKey);
        
        if (courseContent) {
          const parsedContent = JSON.parse(courseContent);
          
          // Find the chapter
          const chapter = parsedContent.find(ch => ch.id === chapterId);
          
          if (chapter && chapter.items) {
            // Find the quiz in the chapter items
            const quiz = chapter.items.find(item => item.id === existingQuizId && item.type === 'quiz');
            
            if (quiz) {
              console.log("Found existing quiz in course content:", quiz);
              
              // Set quiz settings
              setQuizTitle(quiz.title || initialTitle || "");
              setQuizDescription(quiz.description || initialDesc || "");
              setPassingScore(quiz.passingScore || 70);
              setTimeLimit(quiz.timeLimit || 30);
              setAttempts(quiz.attempts || 1);
              setIsPublished(quiz.isPublished || false);
              
              // Set questions
              if (quiz.questions && quiz.questions.length > 0) {
                setQuestions(quiz.questions);
                console.log("Loaded", quiz.questions.length, "questions");
              } else {
                console.log("No questions found in the quiz");
              }
              
              // Save this data to the quiz-specific localStorage key
              // for future editing sessions
              const quizData = {
                id: existingQuizId,
                title: quiz.title,
                description: quiz.description,
                passingScore: quiz.passingScore || 70,
                timeLimit: quiz.timeLimit || 30,
                attempts: quiz.attempts || 1,
                isPublished: quiz.isPublished || false,
                questions: quiz.questions || [],
                chapterId,
                courseId,
                isBeingEdited: true
              };
              
              saveQuizToLocalStorage(quizData);
              return;
            }
          }
        }
        
        console.log("Quiz not found in course content, creating new");
        toast.info("Creating a new version of this quiz");
        createInitialQuiz();
      } catch (error) {
        console.error("Error loading quiz from course content:", error);
        toast.error("Failed to load quiz data");
        createInitialQuiz();
      }
    } else {
      // Create a new quiz 
      createInitialQuiz();
    }
  }, [chapterId, courseId, navigate, initialTitle, initialDesc, existingQuizId]);

  // Save quiz data whenever relevant state changes
  useEffect(() => {
    if (quizTitle || quizDescription || questions.length > 0) {
      const quizData = {
        id: quizId,
        title: quizTitle,
        description: quizDescription,
        passingScore: passingScore,
        timeLimit: timeLimit,
        attempts: attempts,
        isPublished: isPublished,
        questions: questions,
        chapterId: chapterId,
        courseId: courseId,
        isBeingEdited: true // Add a flag to indicate this quiz is being edited
      };
      
      saveQuizToLocalStorage(quizData);
    }
  }, [quizId, quizTitle, quizDescription, passingScore, timeLimit, attempts, isPublished, questions, chapterId, courseId]);
  
  // Create a new quiz on first load
  const createInitialQuiz = async () => {
    try {
      setLoading(true);
      
      // Mock API call - replace with your actual API when implemented
      // const response = await Courses_API.post("/quiz", {
      //   chapter_id: chapterId,
      //   quiz_title: quizTitle,
      //   quiz_description: quizDescription,
      //   passing_score: passingScore,
      //   time_limit: timeLimit,
      //   attempts: attempts,
      //   is_published: false
      // });
      
      // Mock response
      const mockResponse = {
        data: {
          _id: "quiz_" + Math.random().toString(36).substr(2, 9),
          quiz_title: quizTitle,
          quiz_description: quizDescription
        }
      };
      
      setQuizId(mockResponse.data._id);
      toast.success("Quiz created successfully!");
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast.error("Failed to create quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestionText("");
    setOptions([
      { text: "", isCorrect: false },
      { text: "", isCorrect: false }
    ]);
    setAllowMultipleAnswers(false);
    setEditingQuestionIndex(null);
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (index) => {
    const question = questions[index];
    setQuestionText(question.text);
    setOptions(question.options);
    setAllowMultipleAnswers(question.allowMultipleAnswers || false);
    setEditingQuestionIndex(index);
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
    if (allowMultipleAnswers) {
      // Toggle for multiple answers
      newOptions[index].isCorrect = !newOptions[index].isCorrect;
    } else {
      // Radio button behavior for single answer
      newOptions.forEach((option, i) => {
        option.isCorrect = i === index;
      });
    }
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    if (options.length < 4) { // Limit to 4 options max
      setOptions([...options, { text: "", isCorrect: false }]);
    } else {
      toast.warning("Maximum of 4 options allowed");
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
    // Validate question form
    if (!questionText.trim()) {
      toast.error("Question text is required");
      return;
    }
    
    // Check at least 2 options have text
    const validOptions = options.filter(option => option.text.trim() !== "");
    if (validOptions.length < 2) {
      toast.error("At least 2 options are required");
      return;
    }
    
    // Check that at least one option is marked as correct
    const hasCorrectOption = options.some(option => option.isCorrect);
    if (!hasCorrectOption) {
      toast.error("Please select at least one correct answer");
      return;
    }
    
    // Filter out empty options
    const filteredOptions = options.filter(option => option.text.trim() !== "");
    
    const newQuestion = {
      id: editingQuestionIndex !== null ? questions[editingQuestionIndex].id : `q_${Date.now()}`,
      text: questionText,
      options: filteredOptions,
      allowMultipleAnswers
    };
    
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

  const handleSaveQuiz = async () => {
    if (questions.length === 0) {
      toast.error("Please add at least one question to the quiz");
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare the quiz data
      const quizData = {
        id: quizId || `quiz_${Date.now()}`,
        title: quizTitle,
        description: quizDescription,
        passingScore: passingScore,
        timeLimit: timeLimit,
        attempts: attempts,
        isPublished: isPublished,
        questions: questions,
        type: "quiz",
        order: Date.now(), // Use timestamp for ordering if not already set
        chapterId: chapterId,
        courseId: courseId,
        isBeingEdited: false // Set to false when saving the quiz
      };
      
      // Save to localStorage for the chapter
      const chapterStorageKey = `course_content_${courseId}`;
      let courseContent = localStorage.getItem(chapterStorageKey);
      
      if (courseContent) {
        courseContent = JSON.parse(courseContent);
        
        // Find the chapter
        const chapterIndex = courseContent.findIndex(ch => ch.id === chapterId);
        
        if (chapterIndex !== -1) {
          // Check if this quiz already exists in the chapter
          const existingQuizIndex = courseContent[chapterIndex].items.findIndex(
            item => (item.id === quizId && item.type === 'quiz') || 
                   (item.title === quizTitle && item.type === 'quiz')
          );
          
          if (existingQuizIndex !== -1) {
            // Update existing quiz
            courseContent[chapterIndex].items[existingQuizIndex] = {
              ...courseContent[chapterIndex].items[existingQuizIndex],
              ...quizData
            };
          } else {
            // Add new quiz
            courseContent[chapterIndex].items.push(quizData);
          }
          
          // Save back to localStorage
          localStorage.setItem(chapterStorageKey, JSON.stringify(courseContent));
        }
      }
      
      // Wait for 1 second to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Quiz saved successfully!");
      
      // Navigate back to course details page with flag to trigger refresh
      navigate(-1, { state: { fromQuizEditor: true } });
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast.error("Failed to save quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async () => {
    try {
      setLoading(true);
      
      // Wait for 1 second to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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

  return (
    <Container fluid className="p-0">
      {/* Header */}
      <div className="w-100 mb-4" style={{ 
        background: 'linear-gradient(135deg, #0062E6 0%, #33A1FD 100%)',
        padding: '30px 0',
        color: 'white',
        borderBottomLeftRadius: '30px',
        borderBottomRightRadius: '30px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
      }}>
        <Container>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <div className="mb-3 mb-md-0">
              <Button 
                variant="light" 
                className="d-flex align-items-center mb-3"
                onClick={handleBackToCourse}
                disabled={loading}
                style={{ 
                  color: '#0062E6',
                  fontWeight: '500',
                  borderRadius: '50px',
                  padding: '8px 16px',
                  border: 'none',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                }}
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
                style={{ 
                  borderRadius: '50px',
                  padding: '10px 20px',
                  fontWeight: '600'
                }}
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
                style={{ 
                  color: '#0062E6',
                  fontWeight: '600',
                  borderRadius: '50px',
                  padding: '10px 20px',
                  border: 'none',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                }}
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
                        min="1"
                        max="100"
                        value={passingScore}
                        onChange={(e) => setPassingScore(Math.min(100, Math.max(1, parseInt(e.target.value) || 0)))}
                        style={{ borderRadius: '8px 0 0 8px' }}
                      />
                      <InputGroup.Text style={{ background: '#f8f9fa' }}>%</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Time Limit (minutes)</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        min="1"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(Math.max(1, parseInt(e.target.value) || 0))}
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
                      style={{
                        width: '70px',
                        height: '70px',
                        background: 'rgba(0, 98, 230, 0.1)'
                      }}
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
                                            style={{
                                              width: '32px',
                                              height: '32px',
                                              borderRadius: '50%',
                                              backgroundColor: '#0062E6',
                                              color: 'white',
                                              fontSize: '0.9rem',
                                              fontWeight: '600'
                                            }}
                                          >
                                            {index + 1}
                                          </div>
                                          <div className="question-preview flex-grow-1 text-truncate" style={{ maxWidth: '60%' }}>
                                            {question.text}
                                          </div>
                                          <div className="ms-auto d-flex">
                                            <Button
                                              variant="outline-primary"
                                              size="sm"
                                              className="me-2 d-flex align-items-center justify-content-center"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditQuestion(index);
                                              }}
                                              style={{ 
                                                width: '32px', 
                                                height: '32px', 
                                                borderRadius: '50%',
                                                padding: '0'
                                              }}
                                            >
                                              <FaEdit />
                                            </Button>
                                            <Button
                                              variant="outline-danger"
                                              size="sm"
                                              className="d-flex align-items-center justify-content-center"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteQuestion(index);
                                              }}
                                              style={{ 
                                                width: '32px', 
                                                height: '32px', 
                                                borderRadius: '50%',
                                                padding: '0'
                                              }}
                                            >
                                              <FaTrash />
                                            </Button>
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
                                                    style={{
                                                      width: '25px',
                                                      height: '25px',
                                                      borderRadius: '50%',
                                                      fontSize: '0.75rem'
                                                    }}
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
            <Form.Group className="mb-4">
              <Form.Label>Question Text</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter your question here"
                style={{ borderRadius: '8px' }}
              />
            </Form.Group>
            
            <div className="mb-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Answer Options</h5>
              <div>
                <Form.Check
                  type="switch"
                  id="multiple-answers-switch"
                  label="Allow multiple correct answers"
                  checked={allowMultipleAnswers}
                  onChange={(e) => setAllowMultipleAnswers(e.target.checked)}
                />
              </div>
            </div>
            
            {options.map((option, index) => (
              <Form.Group key={index} className="mb-3 d-flex align-items-start">
                <div className="me-2" style={{ marginTop: '10px' }}>
                  <Form.Check
                    type={allowMultipleAnswers ? "checkbox" : "radio"}
                    name="correctOption"
                    id={`option-${index}`}
                    checked={option.isCorrect}
                    onChange={() => handleCorrectOptionChange(index)}
                  />
                </div>
                <div className="flex-grow-1">
                  <InputGroup>
                    <InputGroup.Text style={{ background: '#f8f9fa' }}>
                      {String.fromCharCode(65 + index)}
                    </InputGroup.Text>
                    <Form.Control
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Enter option ${String.fromCharCode(65 + index)}`}
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
                disabled={options.length >= 4}
              >
                <FaPlus className="me-2" /> Add Option
              </Button>
              {options.length >= 4 && (
                <div className="text-muted mt-2 small">Maximum of 4 options reached</div>
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
        
        /* Make "Allow multiple correct answers" text larger */
        #multiple-answers-switch + .form-check-label {
          font-size: 1rem;
          font-weight: 500;
        }
      `}</style>
    </Container>
  );
};

export default QuizEditor; 