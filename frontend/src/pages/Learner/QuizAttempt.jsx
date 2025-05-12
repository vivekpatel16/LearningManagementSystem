import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
  Modal,
  Spinner,
  Table
} from "react-bootstrap";
import {
  FaArrowLeft,
  FaClock,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from '../../Api/axiosInstance';
import Assessment_API from '../../Api/assessmentApi';

const QuizAttempt = () => {
  const { id } = useParams(); // id is the ChapterContent _id
  const navigate = useNavigate();
  const location = useLocation();
  
  // Quiz state
  const [quizData, setQuizData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [courseId, setCourseId] = useState(null);
  const [chapterId, setChapterId] = useState(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [debug, setDebug] = useState({});
  
  // Add this function before the useEffect that initializes the quiz
  const checkPreviousAttempts = async (assessmentId, courseId, chapterId) => {
    try {
      console.log("Checking previous attempts before starting new attempt...");
      const result = await Assessment_API.getUserAttempts(assessmentId, courseId, chapterId);
      console.log("Previous attempts data:", result);
      
      if (result && result.assessment && result.attempts) {
        const maxAttempts = result.assessment.max_attempts || 1;
        const passingScore = result.assessment.passing_score || 70;
        const completedAttempts = result.attempts.filter(a => a.completed).length;
        
        console.log(`User has made ${completedAttempts} of ${maxAttempts} allowed attempts. Passing score: ${passingScore}%`);
        
        // If user has reached the maximum number of attempts
        if (completedAttempts >= maxAttempts) {
          // Find the best attempt to display
          let bestAttempt = null;
          if (result.attempts.length > 0) {
            bestAttempt = result.attempts.reduce((best, current) => {
              return (current.score > best.score) ? current : best;
            }, result.attempts[0]);
          }
          
          return {
            attemptsExhausted: true,
            maxAttempts,
            completedAttempts,
            passingScore,
            bestAttempt,
            allAttempts: result.attempts,
            assessmentDetails: result.assessment
          };
        }
      }
      return { attemptsExhausted: false };
    } catch (error) {
      console.error("Error checking previous attempts:", error);
      return { attemptsExhausted: false, error };
    }
  };
  
  // Initialize quiz
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        console.log("Initializing quiz...");
        setLoading(true);
        setError(null);
        
        // Check if we're viewing a previous attempt (no attempts left)
        if (location.state?.quizData?.viewingPreviousAttempt && location.state?.quizData?.previousAttempt) {
          console.log("Viewing previous attempt:", location.state.quizData.previousAttempt);
          setCourseId(location.state.courseId);
          setChapterId(location.state.chapterId);
          setCourseTitle(location.state.courseTitle || "");
          
          // Set the quiz data
          setQuizData(location.state.quizData);
          
          // Set the result directly
          setQuizResult({
            score: location.state.quizData.previousAttempt.score,
            passed: location.state.quizData.previousAttempt.passed,
            details: location.state.quizData.previousAttempt
          });
          setQuizCompleted(true);
          setLoading(false);
      return;
    }
    
        // Try to get data from location state first
        if (location.state?.quizData) {
          console.log("Using quiz data from location state:", location.state);
          const quizDataFromState = location.state.quizData;
          setCourseId(location.state.courseId);
          setChapterId(location.state.chapterId);
          setCourseTitle(location.state.courseTitle || "");
          
          // If we have contentId, we need to fetch the full assessment data
          if (quizDataFromState.contentId) {
            // Check previous attempts first to avoid 403 errors
            const attemptCheck = await checkPreviousAttempts(
              quizDataFromState.contentId,
              location.state.courseId,
              location.state.chapterId
            );
            
            if (attemptCheck.attemptsExhausted) {
              console.log("Maximum attempts reached, showing best attempt:", attemptCheck.bestAttempt);
              
              // Fetch assessment data only to display questions
              try {
                const assessmentResponse = await Assessment_API.getAssessment(quizDataFromState.contentId);
                console.log("Assessment data received:", assessmentResponse);
                console.log("Time limit from backend:", assessmentResponse.timeLimit || assessmentResponse.time_limit);
                
                if (!assessmentResponse || !assessmentResponse.questions || assessmentResponse.questions.length === 0) {
                  setError('Quiz has no questions or could not be loaded properly.');
                  setLoading(false);
                  return;
                }
                
                // Check if time values need type conversion (sometimes they come as strings)
                if (assessmentResponse.timeLimit && typeof assessmentResponse.timeLimit === 'string') {
                  assessmentResponse.timeLimit = parseInt(assessmentResponse.timeLimit, 10) || 30;
                }
                if (assessmentResponse.time_limit && typeof assessmentResponse.time_limit === 'string') {
                  assessmentResponse.time_limit = parseInt(assessmentResponse.time_limit, 10) || 30;
                }
                
                // Normalize the data to ensure consistent property names
                const normalizedQuizData = normalizeQuizData(assessmentResponse);
                setQuizData(normalizedQuizData);
              } catch (err) {
                console.error("Error fetching assessment data:", err);
              }
              
              // Set the result to show completed view
              if (attemptCheck.bestAttempt) {
                setQuizResult({
                  score: attemptCheck.bestAttempt.score,
                  passed: attemptCheck.bestAttempt.passed,
                  details: attemptCheck.bestAttempt,
                  passingScore: attemptCheck.passingScore
                });
                setQuizCompleted(true);
              } else {
                setError(`You have reached the maximum number of attempts (${attemptCheck.maxAttempts}) for this quiz.`);
              }
              
              // Store all attempts for reference
              setDebug(prev => ({ ...prev, previousAttempts: { 
                attempts: attemptCheck.allAttempts,
                assessmentDetails: attemptCheck.assessmentDetails
              } }));
              setLoading(false);
              return;
            }
            
            console.log(`Fetching complete assessment data for ID: ${quizDataFromState.contentId}`);
            try {
              const assessmentResponse = await Assessment_API.getAssessment(quizDataFromState.contentId);
              console.log("Assessment data received:", assessmentResponse);
              console.log("Time limit from backend:", assessmentResponse.timeLimit || assessmentResponse.time_limit);
              
              if (!assessmentResponse || !assessmentResponse.questions || assessmentResponse.questions.length === 0) {
                setError('Quiz has no questions or could not be loaded properly.');
                setLoading(false);
                return;
              }
              
              // Check if time values need type conversion (sometimes they come as strings)
              if (assessmentResponse.timeLimit && typeof assessmentResponse.timeLimit === 'string') {
                assessmentResponse.timeLimit = parseInt(assessmentResponse.timeLimit, 10) || 30;
              }
              if (assessmentResponse.time_limit && typeof assessmentResponse.time_limit === 'string') {
                assessmentResponse.time_limit = parseInt(assessmentResponse.time_limit, 10) || 30;
              }
              
              // Normalize the data to ensure consistent property names
              const normalizedQuizData = normalizeQuizData(assessmentResponse);
              setQuizData(normalizedQuizData);
              
              // Start attempt with the assessment ID
              try {
                const attempt = await Assessment_API.startAttempt(
                  quizDataFromState.contentId,
                  location.state.courseId,
                  location.state.chapterId
                );
                
                console.log("Attempt started successfully:", attempt);
                setAttemptId(attempt._id);
                
                // Initialize answers object
    const initialAnswers = {};
                normalizedQuizData.questions.forEach(question => {
                  initialAnswers[question._id] = question.type === 'multiple' ? [] : '';
    });
    setSelectedAnswers(initialAnswers);
    
                // Set time limit if exists
                if (normalizedQuizData.timeLimit) {
                  // Sanitize time limit
                  const sanitizedTimeLimit = sanitizeTimeLimit(normalizedQuizData.timeLimit);
                  // Always convert to seconds for internal timer
                  setTimeRemaining(sanitizedTimeLimit * 60);
                  console.log(`Setting time limit: ${sanitizedTimeLimit} min = ${sanitizedTimeLimit * 60} seconds`);
                }
              } catch (attemptError) {
                console.error("Error starting quiz attempt:", attemptError);
                if (attemptError.maxAttemptsReached) {
                  setError(attemptError.userFriendlyMessage || 'You have reached the maximum number of attempts for this quiz.');
                } else if (attemptError.assessmentUnavailable) {
                  setError(attemptError.userFriendlyMessage || 'This quiz is not currently available. Please contact your instructor.');
                } else if (attemptError.notAuthorized) {
                  setError(attemptError.userFriendlyMessage || 'You do not have permission to access this quiz.');
                } else if (attemptError.message && attemptError.message.includes('not currently available')) {
                  setError('This quiz is not currently available. Please contact your instructor.');
                } else if (attemptError.message && attemptError.message.includes('maximum number of attempts')) {
                  setError('You have reached the maximum number of attempts for this quiz.');
                } else if (attemptError.response && attemptError.response.status === 403) {
                  setError('This quiz is not currently available or you do not have permission to access it.');
                } else {
                  setError(attemptError.userFriendlyMessage || 'Failed to start quiz attempt. Please try again.');
                }
                setDebug(prev => ({ ...prev, attemptError }));
                setLoading(false);
                return;
              }
              
              setLoading(false);
              return;
            } catch (assessmentError) {
              console.error("Error fetching full assessment:", assessmentError);
              if (assessmentError.response && assessmentError.response.status === 404) {
                setError('Quiz not found. It may have been deleted or you do not have permission to access it.');
                setLoading(false);
                return;
              }
              // Continue to try other methods if this fails
            }
          } else {
            // If we have quiz data directly in the state and it has questions
            if (quizDataFromState.questions && quizDataFromState.questions.length > 0) {
              const normalizedQuizData = normalizeQuizData(quizDataFromState);
              setQuizData(normalizedQuizData);
              
              // Initialize answers object
              const initialAnswers = {};
              normalizedQuizData.questions.forEach(question => {
                initialAnswers[question._id] = question.type === 'multiple' ? [] : '';
              });
              setSelectedAnswers(initialAnswers);
              
              // Set time limit if exists
              if (normalizedQuizData.timeLimit) {
                // Sanitize time limit
                const sanitizedTimeLimit = sanitizeTimeLimit(normalizedQuizData.timeLimit);
                // Always convert to seconds for internal timer
                setTimeRemaining(sanitizedTimeLimit * 60);
                console.log(`Setting time limit: ${sanitizedTimeLimit} min = ${sanitizedTimeLimit * 60} seconds`);
              }
              
              // Check previous attempts before starting a new one
              if (quizDataFromState.contentId || quizDataFromState._id) {
                const assessmentId = quizDataFromState.contentId || quizDataFromState._id;
                
                const attemptCheck = await checkPreviousAttempts(
                  assessmentId,
                  location.state.courseId,
                  location.state.chapterId
                );
                
                if (attemptCheck.attemptsExhausted) {
                  console.log("Maximum attempts reached, showing best attempt:", attemptCheck.bestAttempt);
                  
                  // Set the result to show completed view
                  if (attemptCheck.bestAttempt) {
                    setQuizResult({
                      score: attemptCheck.bestAttempt.score,
                      passed: attemptCheck.bestAttempt.passed,
                      details: attemptCheck.bestAttempt,
                      passingScore: attemptCheck.passingScore
                    });
                    setQuizCompleted(true);
                  } else {
                    setError(`You have reached the maximum number of attempts (${attemptCheck.maxAttempts}) for this quiz.`);
                  }
                  
                  // Store all attempts for reference
                  setDebug(prev => ({ ...prev, previousAttempts: { 
                    attempts: attemptCheck.allAttempts,
                    assessmentDetails: attemptCheck.assessmentDetails
                  } }));
                  setLoading(false);
                  return;
                }
              }
              
              // Try to start attempt
              try {
                const attempt = await Assessment_API.startAttempt(
                  quizDataFromState.contentId || quizDataFromState._id,
                  location.state.courseId,
                  location.state.chapterId
                );
                
                console.log("Attempt started successfully:", attempt);
                setAttemptId(attempt._id);
              } catch (attemptError) {
                console.error("Error starting quiz attempt from state data:", attemptError);
                if (attemptError.maxAttemptsReached) {
                  setError(attemptError.userFriendlyMessage || 'You have reached the maximum number of attempts for this quiz.');
                } else if (attemptError.assessmentUnavailable) {
                  setError(attemptError.userFriendlyMessage || 'This quiz is not currently available. Please contact your instructor.');
                } else if (attemptError.notAuthorized) {
                  setError(attemptError.userFriendlyMessage || 'You do not have permission to access this quiz.');
                } else if (attemptError.message && attemptError.message.includes('not currently available')) {
                  setError('This quiz is not currently available. Please contact your instructor.');
                } else if (attemptError.message && attemptError.message.includes('maximum number of attempts')) {
                  setError('You have reached the maximum number of attempts for this quiz.');
                } else if (attemptError.response && attemptError.response.status === 403) {
                  setError('This quiz is not currently available or you do not have permission to access it.');
                } else {
                  setError(attemptError.userFriendlyMessage || 'Failed to start quiz attempt. Please try again.');
                }
                setDebug(prev => ({ ...prev, attemptError }));
                setLoading(false);
                return;
              }
              
              setLoading(false);
              return;
            }
          }
        }
        
        // Try to get course and chapter IDs from location state or query params
        const courseIdFromUrl = new URLSearchParams(location.search).get('courseId');
        const chapterIdFromUrl = new URLSearchParams(location.search).get('chapterId');
        const courseIdFromState = location.state?.courseId;
        const chapterIdFromState = location.state?.chapterId;
        
        const courseIdValue = courseIdFromUrl || courseIdFromState;
        const chapterIdValue = chapterIdFromUrl || chapterIdFromState;
        
        if (!courseIdValue || !chapterIdValue) {
          console.warn("Missing courseId or chapterId. Using fallbacks.");
        }
        
        setCourseId(courseIdValue);
        setChapterId(chapterIdValue);
        
        console.log(`Using courseId: ${courseIdValue}, chapterId: ${chapterIdValue}`);
        
        // Fetch chapter content by id
        console.log(`Fetching chapter content for ID: ${id}`);
        try {
          const response = await axiosInstance.get(`/chapter-content/${id}`);
          console.log("Chapter content response:", response.data);
          
          if (response.data && response.data.content_type_ref === 'Assessment') {
            console.log("Assessment found:", response.data.contentDetails);
            
            if (!response.data.contentDetails || !response.data.contentDetails.questions || response.data.contentDetails.questions.length === 0) {
              setError('Quiz has no questions or could not be loaded properly.');
              setLoading(false);
              return;
            }
            
            setQuizData(normalizeQuizData(response.data.contentDetails));
            
            // Extract IDs from response if not already set
            const extractedCourseId = courseIdValue || response.data.course_id || response.data.contentDetails.course_id;
            const extractedChapterId = chapterIdValue || response.data.chapter_id || response.data.contentDetails.chapter_id;
            
            if (!extractedCourseId || !extractedChapterId) {
              setError("Cannot find course or chapter information. Please go back and try again.");
              console.error("Missing required IDs:", { extractedCourseId, extractedChapterId });
              setLoading(false);
              return;
            }
            
            setCourseId(extractedCourseId);
            setChapterId(extractedChapterId);
            
            // Check previous attempts before starting a new one
            const attemptCheck = await checkPreviousAttempts(
              response.data.contentDetails._id,
              extractedCourseId,
              extractedChapterId
            );
            
            if (attemptCheck.attemptsExhausted) {
              console.log("Maximum attempts reached, showing best attempt:", attemptCheck.bestAttempt);
              
              // Set the quiz data
              setQuizData(normalizeQuizData({
                ...response.data.contentDetails,
                passingScore: attemptCheck.passingScore || response.data.contentDetails.passing_score || 70
              }));
              
              // Set the result to show completed view
              if (attemptCheck.bestAttempt) {
                setQuizResult({
                  score: attemptCheck.bestAttempt.score,
                  passed: attemptCheck.bestAttempt.passed,
                  details: attemptCheck.bestAttempt,
                  passingScore: attemptCheck.passingScore
                });
                setQuizCompleted(true);
              } else {
                setError(`You have reached the maximum number of attempts (${attemptCheck.maxAttempts}) for this quiz.`);
              }
              
              // Store all attempts for reference
              setDebug(prev => ({ ...prev, previousAttempts: { 
                attempts: attemptCheck.allAttempts,
                assessmentDetails: attemptCheck.assessmentDetails
              } }));
              setLoading(false);
              return;
            }
            
            // Start a new attempt using backend API
            console.log(`Starting attempt for assessment ${response.data.contentDetails._id}...`);
            console.log(`Using courseId: ${extractedCourseId}, chapterId: ${extractedChapterId}`);
            
            try {
              const attempt = await Assessment_API.startAttempt(
                response.data.contentDetails._id, 
                extractedCourseId, 
                extractedChapterId
              );
              
              console.log("Attempt started successfully:", attempt);
              setAttemptId(attempt._id);
              
              // Initialize answers object
              const initialAnswers = {};
              response.data.contentDetails.questions.forEach(question => {
                initialAnswers[question._id] = question.type === 'multiple' ? [] : '';
              });
              setSelectedAnswers(initialAnswers);
              
              // Set time limit if exists
              if (response.data.contentDetails.timeLimit) {
                // Sanitize time limit
                const sanitizedTimeLimit = sanitizeTimeLimit(response.data.contentDetails.timeLimit);
                // Always convert to seconds for internal timer
                setTimeRemaining(sanitizedTimeLimit * 60);
                console.log(`Setting time limit: ${sanitizedTimeLimit} min = ${sanitizedTimeLimit * 60} seconds`);
              }
            } catch (attemptError) {
              console.error("Error starting quiz attempt:", attemptError);
              if (attemptError.maxAttemptsReached) {
                setError(attemptError.userFriendlyMessage || 'You have reached the maximum number of attempts for this quiz.');
              } else if (attemptError.assessmentUnavailable) {
                setError(attemptError.userFriendlyMessage || 'This quiz is not currently available. Please contact your instructor.');
              } else if (attemptError.notAuthorized) {
                setError(attemptError.userFriendlyMessage || 'You do not have permission to access this quiz.');
              } else if (attemptError.message && attemptError.message.includes('not currently available')) {
                setError('This quiz is not currently available. Please contact your instructor.');
              } else if (attemptError.message && attemptError.message.includes('maximum number of attempts')) {
                setError('You have reached the maximum number of attempts for this quiz.');
              } else if (attemptError.response && attemptError.response.status === 403) {
                setError('This quiz is not currently available or you do not have permission to access it.');
              } else {
                setError(attemptError.userFriendlyMessage || 'Failed to start quiz attempt. Please try again.');
              }
              setDebug(prev => ({ ...prev, attemptError }));
              setLoading(false);
              return;
            }
          } else {
            setError('Quiz not found or invalid content type.');
            console.error("Invalid content type or missing data:", response.data);
          }
        } catch (fetchError) {
          console.error("Error fetching chapter content:", fetchError);
          if (fetchError.response && fetchError.response.status === 404) {
            setError('Quiz not found. It may have been deleted or moved.');
          } else {
            setError('Failed to load quiz. Please try again later.');
          }
        }
      } catch (err) {
        console.error("Error initializing quiz:", err);
        setError(err.response?.data?.message || 'Failed to load quiz. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    initializeQuiz();
  }, [id, location]);
  
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
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };
  
  // Handle answer selection
  const handleAnswerSelect = (questionId, optionIndex) => {
    setSelectedAnswers(prev => {
      const question = quizData.questions.find(q => q._id === questionId);
      
      if (question.type === 'multiple') {
        const currentSelections = [...(prev[questionId] || [])];
        
        if (currentSelections.includes(optionIndex)) {
          return {
            ...prev,
            [questionId]: currentSelections.filter(index => index !== optionIndex)
          };
        } else {
          return {
            ...prev,
            [questionId]: [...currentSelections, optionIndex]
          };
        }
      } else {
        return {
          ...prev,
          [questionId]: optionIndex
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
  
  // Calculate number of questions answered
  const getAnsweredQuestionsCount = () => {
    return Object.values(selectedAnswers).filter(answer => {
      if (Array.isArray(answer)) {
        return answer.length > 0;
      }
      return answer !== '';
    }).length;
  };
  
  // Fetch previous attempts for this quiz
  const fetchPreviousAttempts = async () => {
    if (!quizData || !quizData._id || !courseId || !chapterId) {
      console.log("Missing required data to fetch previous attempts");
      return null;
    }
    
    try {
      const result = await Assessment_API.getUserAttempts(
        quizData._id || quizData.contentId,
        courseId,
        chapterId
      );
      
      console.log("Fetched previous attempts:", result);
      return result;
    } catch (error) {
      console.error("Error fetching previous attempts:", error);
      return null;
    }
  };
  
  // Handle quiz submission (use backend)
  const handleSubmitQuiz = async () => {
    try {
      console.log("Submitting quiz...");
      setIsSubmitting(true);
      
      if (!attemptId) {
        const errorMsg = "No active attempt found. Please refresh and try again.";
        toast.error(errorMsg);
        setError(errorMsg);
        setIsSubmitting(false);
        return;
      }
      
      // Prepare answers in backend format
      const formattedAnswers = [];
      quizData.questions.forEach((question) => {
        const userAnswer = selectedAnswers[question._id];
        if (userAnswer === '' || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
          // Skip unanswered questions
          console.log(`Question ${question._id} was not answered`);
        } else {
          formattedAnswers.push({
            question_id: question._id,
            selected_options: Array.isArray(userAnswer) ? userAnswer : [userAnswer]
          });
        }
      });
      
      console.log("Formatted answers:", formattedAnswers);
      
      // Calculate timeTaken correctly based on original time limit
      let timeTaken;
      if (quizData.timeLimit) {
        // Time limit is already in seconds, and timeRemaining is in seconds too
        timeTaken = quizData.timeLimit - timeRemaining;
        console.log(`Time taken: ${timeTaken} seconds (${Math.floor(timeTaken / 60)} min and ${timeTaken % 60} seconds)`);
      }
      
      // Submit to backend
      console.log(`Submitting attempt ${attemptId} to backend...`);
      const result = await Assessment_API.submitAttempt(attemptId, formattedAnswers, timeTaken);
      console.log("Quiz submission result:", result);
      
      setQuizResult({ 
        score: result.score, 
        passed: result.passed,
        details: result
      });
      setQuizCompleted(true);
      
      // Fetch previous attempts to display in the completion page
      try {
        const previousAttempts = await fetchPreviousAttempts();
        if (previousAttempts && previousAttempts.attempts && previousAttempts.attempts.length > 0) {
          setDebug(prev => ({ ...prev, previousAttempts }));
        }
      } catch (err) {
        console.error("Error fetching previous attempts:", err);
      }

      if (result.passed) {
        toast.success(`Congratulations! You passed the quiz with ${result.score}%`);
        } else {
        toast.error(`You scored ${result.score}%. Minimum passing score is ${quizData.passingScore}%`);
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      
      // Handle specific error types
      if (error.maxAttemptsReached) {
        // If we already have information about attempts, use that
        if (error.previousAttempts && error.maxAttemptsInfo) {
          const bestAttempt = error.bestAttempt;
          setError(`You have reached the maximum number of attempts (${error.maxAttemptsInfo.maxAttempts}) for this quiz.`);
          
          // Set the result to show the best previous attempt
          if (bestAttempt) {
            setQuizResult({
              score: bestAttempt.score,
              passed: bestAttempt.passed,
              details: bestAttempt,
              passingScore: error.maxAttemptsInfo.passingScore
            });
            setQuizCompleted(true);
          }
          
          setDebug(prev => ({ 
            ...prev, 
            submitError: error,
            previousAttempts: { 
              attempts: error.previousAttempts,
              assessmentDetails: {
                max_attempts: error.maxAttemptsInfo.maxAttempts,
                passing_score: error.maxAttemptsInfo.passingScore
              }
            }
          }));
        } else {
          // Try to fetch previous attempts information
          const fetchAttemptsInfo = async () => {
            try {
              if (quizData && quizData._id && courseId && chapterId) {
                const attemptCheck = await checkPreviousAttempts(
                  quizData._id || quizData.contentId,
                  courseId,
                  chapterId
                );
                
                if (attemptCheck.attemptsExhausted && attemptCheck.bestAttempt) {
                  setQuizResult({
                    score: attemptCheck.bestAttempt.score,
                    passed: attemptCheck.bestAttempt.passed,
                    details: attemptCheck.bestAttempt,
                    passingScore: attemptCheck.passingScore
                  });
                  setQuizCompleted(true);
                  
                  setDebug(prev => ({ 
                    ...prev, 
                    submitError: error,
                    previousAttempts: { 
                      attempts: attemptCheck.allAttempts,
                      assessmentDetails: attemptCheck.assessmentDetails
                    }
                  }));
                } else {
                  setError(error.userFriendlyMessage || 'You have reached the maximum number of attempts for this assessment');
                  setDebug(prev => ({ ...prev, submitError: error }));
                }
              } else {
                setError(error.userFriendlyMessage || 'You have reached the maximum number of attempts for this assessment');
                setDebug(prev => ({ ...prev, submitError: error }));
              }
            } catch (fetchError) {
              console.error("Error fetching attempts info:", fetchError);
              setError(error.userFriendlyMessage || 'You have reached the maximum number of attempts for this assessment');
              setDebug(prev => ({ ...prev, submitError: error }));
            }
          };
          
          fetchAttemptsInfo();
        }
      } else if (error.response && error.response.status === 403 && 
          error.response.data && error.response.data.message && 
          error.response.data.message.includes('maximum number of attempts')) {
        // Same logic for the regular 403 error, try to fetch previous attempts
        const fetchAttemptsInfo = async () => {
          try {
            if (quizData && (quizData._id || quizData.contentId) && courseId && chapterId) {
              const attemptCheck = await checkPreviousAttempts(
                quizData._id || quizData.contentId,
                courseId,
                chapterId
              );
              
              if (attemptCheck.attemptsExhausted && attemptCheck.bestAttempt) {
                setQuizResult({
                  score: attemptCheck.bestAttempt.score,
                  passed: attemptCheck.bestAttempt.passed,
                  details: attemptCheck.bestAttempt,
                  passingScore: attemptCheck.passingScore
                });
      setQuizCompleted(true);
      
                setDebug(prev => ({ 
                  ...prev, 
                  submitError: error,
                  previousAttempts: { 
                    attempts: attemptCheck.allAttempts,
                    assessmentDetails: attemptCheck.assessmentDetails
                  }
                }));
      } else {
                setError('You have reached the maximum number of attempts for this assessment');
                setDebug(prev => ({ ...prev, submitError: error }));
              }
            } else {
              setError('You have reached the maximum number of attempts for this assessment');
              setDebug(prev => ({ ...prev, submitError: error }));
            }
          } catch (fetchError) {
            console.error("Error fetching attempts info:", fetchError);
            setError('You have reached the maximum number of attempts for this assessment');
            setDebug(prev => ({ ...prev, submitError: error }));
          }
        };
        
        fetchAttemptsInfo();
      } else {
        toast.error(error.userFriendlyMessage || "Failed to submit quiz. Please try again.");
        setDebug(prev => ({ ...prev, submitError: error }));
      }
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

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    if (!quizCompleted && getAnsweredQuestionsCount() > 0) {
      setShowConfirmModal(true);
    } else {
      navigate(`/quiz-dashboard/${id}`, {
        state: {
          quizData,
          courseId,
          chapterId,
          courseTitle
        }
      });
    }
  };
  
  // Current question
  const currentQuestion = quizData?.questions[currentQuestionIndex];
  
  // Improve the sanitizeTimeLimit function to properly convert seconds to minutes
  const sanitizeTimeLimit = (timeValue) => {
    if (!timeValue) return 30; // Default time limit in minutes
    
    // Ensure it's a number
    const numericValue = parseInt(timeValue, 10);
    
    // Always consider the value as seconds and convert to minutes
    return Math.round(numericValue / 60);
  };
  
  // Format time limit as a string with "min" suffix
  const formatTimeLimit = (timeValue) => {
    const minutes = sanitizeTimeLimit(timeValue);
    return `${minutes} min`;
  };
  
  // Update the normalizeQuizData function to use sanitizeTimeLimit
  const normalizeQuizData = (assessmentData) => {
    if (!assessmentData) return null;
    
    let rawTimeLimit = assessmentData.timeLimit || assessmentData.time_limit || 30 * 60; // Default 30 minutes in seconds
    console.log(`Original time limit value: ${rawTimeLimit}, type: ${typeof rawTimeLimit}`);
    
    // Sanitize the time limit to ensure it's reasonable
    const sanitizedTimeLimit = sanitizeTimeLimit(rawTimeLimit);
    console.log(`Sanitized time limit: ${sanitizedTimeLimit} min`);
    
    // Create a normalized copy with consistent property names
    return {
      ...assessmentData,
      // Ensure passingScore is available (might be passing_score in backend format)
      passingScore: assessmentData.passingScore || assessmentData.passing_score || 70,
      // Ensure timeLimit is available and stored in seconds
      timeLimit: rawTimeLimit,
      // Ensure attempts is available (might be max_attempts in backend format)
      attempts: assessmentData.attempts || assessmentData.max_attempts || 1
    };
  };
  
  // Update the calculateTimerProgress function to handle seconds correctly
  const calculateTimerProgress = () => {
    if (!quizData?.timeLimit) return 100;
    
    // Use the raw timeLimit value which is in seconds
    const totalSeconds = quizData.timeLimit;
    const progress = (timeRemaining / totalSeconds) * 100;
    return Math.max(0, Math.min(100, progress)); // Ensure it's between 0-100
  };
  
  // Determine timer color based on time remaining
  const getTimerClasses = () => {
    if (timeRemaining <= 60) {
      return 'timer-critical'; // Less than 1 minute
    } else if (timeRemaining <= 300) {
      return 'timer-warning'; // Less than 5 minutes
    }
    return '';
  };
  
  if (loading && !quizData) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    const isMaxAttemptsError = error.includes('maximum number of attempts') || 
                              (debug?.submitError?.message && debug.submitError.message.includes('maximum number of attempts'));
    
    // If it's a max attempts error, try to fetch and show previous attempts
    useEffect(() => {
      if (isMaxAttemptsError) {
        const loadPreviousAttempts = async () => {
          const previousAttempts = await fetchPreviousAttempts();
          if (previousAttempts && previousAttempts.attempts && previousAttempts.attempts.length > 0) {
            setDebug(prev => ({ ...prev, previousAttempts }));
          }
        };
        
        loadPreviousAttempts();
      }
    }, [isMaxAttemptsError]);
    
    return (
      <Container className="py-4">
        {isMaxAttemptsError ? (
          <div>
            <Alert variant="warning" className="mb-3">
              <Alert.Heading>Maximum Attempts Reached</Alert.Heading>
              <p>
                You have reached the maximum number of attempts allowed for this quiz. Please contact your instructor if you need the attempts to be reset.
              </p>
            </Alert>
            
            {debug?.previousAttempts?.attempts && debug.previousAttempts.attempts.length > 0 && (
              <Card className="mb-4">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Previous Attempts</h5>
                  {debug?.previousAttempts?.assessmentDetails?.passing_score && (
                    <p className="text-muted mb-0 mt-1">
                      Passing score: {debug.previousAttempts.assessmentDetails.passing_score}%
                    </p>
                  )}
                </Card.Header>
                <Card.Body>
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Score</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Sort attempts by date, oldest first */}
                      {[
                        // Previous attempts 
                        ...(debug.previousAttempts.attempts || []),
                        // Current attempt
                        {
                          _id: "current",
                          date_completed: new Date(),
                          score: quizResult.score,
                          passed: quizResult.passed,
                          isCurrent: true
                        }
                      ]
                        .sort((a, b) => new Date(a.date_completed || a.createdAt) - new Date(b.date_completed || b.createdAt))
                        .map((attempt, index) => (
                          <tr key={attempt._id} className={attempt.isCurrent ? "table-primary" : ""}>
                            <td>{index + 1}</td>
                            <td>{new Date(attempt.date_completed || attempt.createdAt).toLocaleString()}</td>
                            <td>{attempt.score}%</td>
                            <td>
                              <Badge bg={attempt.passed ? "success" : "danger"}>
                                {attempt.passed ? "Passed" : "Failed"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}
            
            <div className="mb-3">
              <h5>What happens now?</h5>
              <ul>
                <li>You cannot make any more attempts at this quiz</li>
                <li>Your highest score will be counted toward your progress</li>
                <li>You can still view your previous attempt results</li>
              </ul>
            </div>
          </div>
        ) : (
          <Alert variant="danger">
            {error}
          </Alert>
        )}
        
        <div className="dropdown">
          <Button 
            variant="outline-primary" 
            className="d-flex align-items-center dropdown-toggle"
            id="errorBackDropdown"
            data-bs-toggle="dropdown" 
            aria-expanded="false"
          >
            <FaArrowLeft className="me-2" /> Back
          </Button>
          <ul className="dropdown-menu" aria-labelledby="errorBackDropdown">
            <li>
              <button 
                className="dropdown-item d-flex align-items-center" 
                onClick={handleBackToDashboard}
              >
                <FaArrowLeft className="me-2" /> Back to Quiz Dashboard
              </button>
            </li>
            <li>
              <button 
                className="dropdown-item d-flex align-items-center" 
                onClick={handleBackToCourse}
              >
                <FaArrowLeft className="me-2" /> {courseTitle ? `Back to ${courseTitle}` : 'Back to Course'}
              </button>
            </li>
          </ul>
        </div>
        
        {/* Debug information - can be removed in production */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-4 p-3 border rounded bg-light">
            <h6>Debug Information:</h6>
            <ul className="mb-0">
              <li>Quiz ID: {id}</li>
              <li>Content ID: {location.state?.quizData?.contentId || "Not available"}</li>
              <li>Course ID: {courseId || "Not available"}</li>
              <li>Chapter ID: {chapterId || "Not available"}</li>
              <li>Error Time: {new Date().toLocaleString()}</li>
            </ul>
          </div>
        )}
      </Container>
    );
  }

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          This quiz has no questions or could not be loaded properly.
        </Alert>
        <div className="dropdown">
          <Button 
            variant="outline-primary" 
            className="d-flex align-items-center dropdown-toggle"
            id="noQuestionsBackDropdown"
            data-bs-toggle="dropdown" 
            aria-expanded="false"
          >
            <FaArrowLeft className="me-2" /> Back
          </Button>
          <ul className="dropdown-menu" aria-labelledby="noQuestionsBackDropdown">
            <li>
              <button 
                className="dropdown-item d-flex align-items-center" 
                onClick={handleBackToDashboard}
              >
                <FaArrowLeft className="me-2" /> Back to Quiz Dashboard
              </button>
            </li>
            <li>
              <button 
                className="dropdown-item d-flex align-items-center" 
                onClick={handleBackToCourse}
              >
                <FaArrowLeft className="me-2" /> {courseTitle ? `Back to ${courseTitle}` : 'Back to Course'}
              </button>
            </li>
          </ul>
        </div>
      </Container>
    );
  }

  if (quizCompleted && quizResult) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom py-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">Quiz Results</h4>
                  <div className="dropdown">
                    <Button 
                      variant="outline-primary" 
                      className="d-flex align-items-center dropdown-toggle"
                      id="resultsBackDropdown"
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                    >
                      <FaArrowLeft className="me-2" /> Back
                    </Button>
                    <ul className="dropdown-menu" aria-labelledby="resultsBackDropdown">
                      <li>
                        <button 
                          className="dropdown-item d-flex align-items-center" 
                          onClick={handleBackToDashboard}
                        >
                          <FaArrowLeft className="me-2" /> Back to Quiz Dashboard
                        </button>
                      </li>
                      <li>
                        <button 
                          className="dropdown-item d-flex align-items-center" 
                          onClick={handleBackToCourse}
                        >
                          <FaArrowLeft className="me-2" /> {courseTitle ? `Back to ${courseTitle}` : 'Back to Course'}
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  {quizResult.passed ? (
                    <FaCheckCircle size={64} className="text-success mb-3" />
                  ) : (
                    <FaTimesCircle size={64} className="text-danger mb-3" />
                  )}
                  <h3 className="mb-3">
                    {quizResult.passed ? 'Congratulations!' : 'Try Again'}
                  </h3>
                  <p className="text-muted">
                    You scored {quizResult.score}% 
                    {quizResult.passed ? ' and passed the quiz!' : 
                      quizData && quizData.passingScore ? ` but needed ${quizData.passingScore}% to pass.` : 
                      ` but did not meet the passing score.`}
                  </p>
                </div>
                
                {/* Add Attempts Summary Card */}
                <Card className="mb-4 border-0 bg-light">
                  <Card.Body>
                    <h5 className="mb-3">Attempt Summary</h5>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Date Completed:</span>
                      <span className="fw-bold">{new Date().toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Score:</span>
                      <span className="fw-bold">{quizResult.score}%</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Result:</span>
                      <Badge bg={quizResult.passed ? "success" : "danger"}>
                        {quizResult.passed ? "Passed" : "Failed"}
                      </Badge>
                    </div>
                    {quizData?.attempts > 1 && (
                      <div className="d-flex justify-content-between">
                        <span>Attempts Used:</span>
                        <span className="fw-bold">
                          {debug?.previousAttempts?.attempts ? 
                            1 + (debug.previousAttempts.attempts ? debug.previousAttempts.attempts.length : 0) : 
                            "1"} of {quizData.attempts}
                        </span>
                      </div>
                    )}
                  </Card.Body>
                </Card>
                
                {/* Show Previous Attempts if available */}
                {debug?.previousAttempts?.attempts && debug.previousAttempts.attempts.length > 0 ? (
                  <Card className="mb-4 border-0">
                    <Card.Header className="bg-white">
                      <h5 className="mb-0">All Attempts</h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <Table striped bordered hover responsive className="mb-0">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Score</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Sort attempts by date, oldest first */}
                          {[
                            // Previous attempts 
                            ...(debug.previousAttempts.attempts || []),
                            // Current attempt
                            {
                              _id: "current",
                              date_completed: new Date(),
                              score: quizResult.score,
                              passed: quizResult.passed,
                              isCurrent: true
                            }
                          ]
                            .sort((a, b) => new Date(a.date_completed || a.createdAt) - new Date(b.date_completed || b.createdAt))
                            .map((attempt, index) => (
                              <tr key={attempt._id} className={attempt.isCurrent ? "table-primary" : ""}>
                                <td>{index + 1}</td>
                                <td>{new Date(attempt.date_completed || attempt.createdAt).toLocaleString()}</td>
                                <td>{attempt.score}%</td>
                                <td>
                                  <Badge bg={attempt.passed ? "success" : "danger"}>
                                    {attempt.passed ? "Passed" : "Failed"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                ) : (
                  <Card className="mb-4 border-0">
                    <Card.Header className="bg-white">
                      <h5 className="mb-0">Attempt History</h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <Table striped bordered hover responsive className="mb-0">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Score</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Sort attempts by date, oldest first */}
                          {[
                            // Previous attempts 
                            ...(debug.previousAttempts.attempts || []),
                            // Current attempt
                            {
                              _id: "current",
                              date_completed: new Date(),
                              score: quizResult.score,
                              passed: quizResult.passed,
                              isCurrent: true
                            }
                          ]
                            .sort((a, b) => new Date(a.date_completed || a.createdAt) - new Date(b.date_completed || b.createdAt))
                            .map((attempt, index) => (
                              <tr key={attempt._id} className={attempt.isCurrent ? "table-primary" : ""}>
                                <td>{index + 1}</td>
                                <td>{new Date(attempt.date_completed || attempt.createdAt).toLocaleString()}</td>
                                <td>{attempt.score}%</td>
                                <td>
                                  <Badge bg={attempt.passed ? "success" : "danger"}>
                                    {attempt.passed ? "Passed" : "Failed"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                )}

                {quizResult.details && quizResult.details.answers && (
                  <div className="mt-4">
                    <h5>Question Analysis</h5>
                    {quizResult.details.answers.map((result, index) => (
                      <div key={index} className="mb-3 p-3 border rounded">
                        <div className="d-flex align-items-center mb-2">
                          {result.is_correct ? (
                            <FaCheckCircle className="text-success me-2" />
                          ) : (
                            <FaTimesCircle className="text-danger me-2" />
                          )}
                          <strong>Question {result.question_index}</strong>
                      </div>
                        <p className="mb-1">{quizData?.questions?.[result.question_index - 1]?.question_text || 'Question not available'}</p>
                        <small className="text-muted">
                          Your answer: {result.selected_options.map(optionIndex => {
                            const questionIndex = result.question_index - 1;
                            // Try to get the option text if available
                            if (quizData?.questions && 
                                questionIndex >= 0 && 
                                quizData.questions[questionIndex]?.options && 
                                quizData.questions[questionIndex].options[optionIndex]) {
                              return quizData.questions[questionIndex].options[optionIndex].text;
                            } else {
                              // Fallback to just showing the option index
                              return `Option ${optionIndex + 1}`;
                            }
                          }).join(', ')}
                        </small>
                    </div>
                    ))}
                  </div>
                )}
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
            <div className="dropdown">
              <Button 
                variant="light" 
                className="d-flex align-items-center dropdown-toggle"
                id="backDropdown"
                data-bs-toggle="dropdown" 
                aria-expanded="false"
                style={{ 
                  color: '#0062E6',
                  fontWeight: '500',
                  borderRadius: '50px',
                  padding: '8px 16px',
                  border: 'none',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                }}
              >
                <FaArrowLeft className="me-2" /> Back
              </Button>
              <ul className="dropdown-menu" aria-labelledby="backDropdown">
                <li>
                  <button 
                    className="dropdown-item d-flex align-items-center" 
                    onClick={handleBackToDashboard}
                    disabled={isSubmitting}
                  >
                    <FaArrowLeft className="me-2" /> Back to Quiz Dashboard
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item d-flex align-items-center" 
                    onClick={handleBackToCourse}
                    disabled={isSubmitting}
                  >
                    <FaArrowLeft className="me-2" /> {courseTitle ? `Back to ${courseTitle}` : 'Back to Course'}
                  </button>
                </li>
              </ul>
            </div>
            
            {quizData?.timeLimit > 0 && (
              <div className="timer-container">
                <div className={`d-flex align-items-center px-3 py-2 rounded-pill bg-white bg-opacity-25 ${getTimerClasses()}`}>
                <FaClock className="me-2" />
                  <div>
                    <small className="d-block text-white-50 mb-0 lh-1">Time Remaining</small>
                    <span className="fw-bold timer-display">
                      {formatTimeRemaining()}
                    </span>
                  </div>
                </div>
                <div className={`timer-progress ${getTimerClasses()}`} style={{ width: `${calculateTimerProgress()}%` }}></div>
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
                <div className="d-flex align-items-center text-muted small">
                  <div className="me-3">{getAnsweredQuestionsCount()} of {quizData?.questions.length} questions answered</div>
                  {quizData?.timeLimit > 0 && (
                    <div className="me-3">
                      <FaClock className="me-1" /> Time limit: {formatTimeLimit(quizData.timeLimit)}
                    </div>
                  )}
                  {quizData?.passingScore && (
                    <div>
                      <FaCheckCircle className="me-1" /> Passing score: {quizData.passingScore}%
                    </div>
                  )}
                </div>
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
                    <p className="mb-0">Read each question carefully and select the correct answer(s). 
                      {quizData?.timeLimit && (
                        <span> You have <b>{formatTimeLimit(quizData.timeLimit)}</b> to complete this quiz.</span>
                      )}
                      {quizData?.passingScore && (
                        <span> You need to score at least <b>{quizData.passingScore}%</b> to pass.</span>
                      )}
                    </p>
                  </div>
                </Alert>
                
                {/* Question */}
                {currentQuestion ? (
                <div className="question-container">
                  <div className="question-number mb-3">
                    <Badge bg="primary" className="px-3 py-2">Question {currentQuestionIndex + 1} of {quizData?.questions.length}</Badge>
                  </div>
                  
                    <h4 className="mb-4">{currentQuestion?.question_text || currentQuestion?.text}</h4>
                  
                  <Form>
                    {currentQuestion?.options.map((option, optionIndex) => {
                        const isMultipleAnswer = currentQuestion.type === 'multiple';
                      const isSelected = isMultipleAnswer 
                          ? selectedAnswers[currentQuestion._id]?.includes(optionIndex)
                          : selectedAnswers[currentQuestion._id] === optionIndex;
                      
                      return (
                        <Form.Check
                          key={optionIndex}
                          type={isMultipleAnswer ? "checkbox" : "radio"}
                            id={`option-${currentQuestion._id}-${optionIndex}`}
                            name={`question-${currentQuestion._id}`}
                          label={option.text}
                          checked={isSelected}
                            onChange={() => handleAnswerSelect(currentQuestion._id, optionIndex)}
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
                ) : (
                  <Alert variant="warning">
                    Question data could not be loaded.
                  </Alert>
                )}
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
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Submitting...
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
              {quizData?.questions.map((question, index) => {
                const isAnswered = Array.isArray(selectedAnswers[question._id]) 
                  ? selectedAnswers[question._id].length > 0 
                  : selectedAnswers[question._id] !== '';
                
                return (
                  <Button
                    key={question._id}
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
          {currentQuestionIndex === quizData?.questions.length - 1 ? (
            <Button 
              variant="primary" 
              onClick={() => {
                setShowConfirmModal(false);
                handleSubmitQuiz();
              }}
            >
              Submit Quiz
            </Button>
          ) : (
            <>
              <Button 
                variant="outline-primary"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleBackToDashboard();
                }}
              >
                Back to Dashboard
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  setShowConfirmModal(false);
                  handleBackToCourse(); 
                }}
              >
                Back to Course
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
      
      {/* CSS Styles */}
      <style jsx="true">{`
        .timer-display {
          font-family: monospace;
          letter-spacing: 0.5px;
          font-size: 1.1rem;
        }
        .timer-container {
          position: relative;
          overflow: hidden;
          border-radius: 50px;
        }
        .timer-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.7);
          transition: width 1s linear;
        }
        .timer-warning {
          background-color: rgba(255, 193, 7, 0.2);
        }
        .timer-warning .timer-display {
          color: #ffc107;
        }
        .timer-warning.timer-progress {
          background-color: rgba(255, 193, 7, 0.7);
        }
        .timer-critical {
          background-color: rgba(220, 53, 69, 0.2);
          animation: pulse 1s infinite;
        }
        .timer-critical .timer-display {
          color: #dc3545;
        }
        .timer-critical.timer-progress {
          background-color: rgba(220, 53, 69, 0.7);
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </Container>
  );
};

export default QuizAttempt; 