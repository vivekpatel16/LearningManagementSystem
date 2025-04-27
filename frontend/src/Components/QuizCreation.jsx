import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  IconButton,
  Typography,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axiosInstance from '../Api/axiosInstance';

const QuizCreation = ({ chapterId, onQuizCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([{
    question_text: '',
    options: [{ text: '', isCorrect: false }],
    points: 1
  }]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddQuestion = () => {
    setQuestions([...questions, {
      question_text: '',
      options: [{ text: '', isCorrect: false }],
      points: 1
    }]);
  };

  const handleRemoveQuestion = (questionIndex) => {
    setQuestions(questions.filter((_, index) => index !== questionIndex));
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex][field] = value;
    setQuestions(newQuestions);
  };

  const handleAddOption = (questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push({ text: '', isCorrect: false });
    setQuestions(newQuestions);
  };

  const handleRemoveOption = (questionIndex, optionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter(
      (_, index) => index !== optionIndex
    );
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, field, value) => {
    const newQuestions = [...questions];
    if (field === 'isCorrect') {
      // If setting this option as correct, set all other options as incorrect
      newQuestions[questionIndex].options.forEach((option, index) => {
        option.isCorrect = index === optionIndex;
      });
    } else {
      newQuestions[questionIndex].options[optionIndex][field] = value;
    }
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate quiz data
      if (!title.trim()) {
        throw new Error('Quiz title is required');
      }

      if (!description.trim()) {
        throw new Error('Quiz description is required');
      }

      // Validate questions
      questions.forEach((question, qIndex) => {
        if (!question.question_text.trim()) {
          throw new Error(`Question ${qIndex + 1} text is required`);
        }

        if (question.options.length < 2) {
          throw new Error(`Question ${qIndex + 1} must have at least 2 options`);
        }

        const hasCorrectOption = question.options.some(opt => opt.isCorrect);
        if (!hasCorrectOption) {
          throw new Error(`Question ${qIndex + 1} must have a correct answer selected`);
        }

        question.options.forEach((option, oIndex) => {
          if (!option.text.trim()) {
            throw new Error(`Option ${oIndex + 1} in Question ${qIndex + 1} cannot be empty`);
          }
        });
      });

      const response = await axiosInstance.post('/api/quiz', {
        title,
        description,
        chapter_id: chapterId,
        questions
      });

      if (response.data.success) {
        onQuizCreated(response.data.data);
        // Reset form
        setTitle('');
        setDescription('');
        setQuestions([{
          question_text: '',
          options: [{ text: '', isCorrect: false }],
          points: 1
        }]);
      } else {
        throw new Error(response.data.message || 'Failed to create quiz');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while creating the quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 800, mx: 'auto', p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quiz Details
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Quiz Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Quiz Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
              required
            />
          </Stack>
        </CardContent>
      </Card>

      {questions.map((question, questionIndex) => (
        <Card key={questionIndex} sx={{ mb: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  Question {questionIndex + 1}
                </Typography>
                {questions.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveQuestion(questionIndex)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>

              <TextField
                label="Question Text"
                value={question.question_text}
                onChange={(e) => handleQuestionChange(questionIndex, 'question_text', e.target.value)}
                fullWidth
                required
              />

              <TextField
                label="Points"
                type="number"
                value={question.points}
                onChange={(e) => handleQuestionChange(questionIndex, 'points', parseInt(e.target.value) || 1)}
                inputProps={{ min: 1 }}
                sx={{ width: 100 }}
              />

              <Typography variant="subtitle1">Options:</Typography>
              <FormControl component="fieldset">
                <RadioGroup>
                  {question.options.map((option, optionIndex) => (
                    <Box key={optionIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <FormControlLabel
                        value={optionIndex.toString()}
                        control={<Radio />}
                        checked={option.isCorrect}
                        onChange={() => handleOptionChange(questionIndex, optionIndex, 'isCorrect', true)}
                      />
                      <TextField
                        value={option.text}
                        onChange={(e) => handleOptionChange(questionIndex, optionIndex, 'text', e.target.value)}
                        placeholder={`Option ${optionIndex + 1}`}
                        fullWidth
                        required
                      />
                      {question.options.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveOption(questionIndex, optionIndex)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                </RadioGroup>
              </FormControl>

              <Button
                startIcon={<AddIcon />}
                onClick={() => handleAddOption(questionIndex)}
                variant="outlined"
                sx={{ alignSelf: 'flex-start' }}
              >
                Add Option
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}

      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddQuestion}
          variant="outlined"
        >
          Add Question
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Creating Quiz...' : 'Create Quiz'}
        </Button>
      </Stack>
    </Box>
  );
};

export default QuizCreation; 