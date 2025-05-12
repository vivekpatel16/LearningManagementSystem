import axiosInstance from './axiosInstance';

const Assessment_API = {
    // Get assessment details
    getAssessment: async (assessmentId) => {
        if (!assessmentId) {
            throw new Error("Assessment ID is required");
        }
        
        try {
            console.log(`Fetching assessment with ID: ${assessmentId}`);
            const response = await axiosInstance.get(`/assessment/${assessmentId}`);
            console.log('Assessment data received:', response.data);
            return response.data;
        } catch (error) {
            console.error("Error fetching assessment:", error);
            
            // If the error is a 404, try a different endpoint format
            if (error.response && error.response.status === 404) {
                try {
                    // Try alternative endpoint format
                    console.log(`Retrying with alternative endpoint for ID: ${assessmentId}`);
                    const retryResponse = await axiosInstance.get(`/assessment/contents/${assessmentId}`);
                    console.log('Assessment data received from alternative endpoint:', retryResponse.data);
                    return retryResponse.data;
                } catch (retryError) {
                    console.error("Error in retry fetch:", retryError);
                    throw retryError;
                }
            }
            
            throw error;
        }
    },

    // Start an assessment attempt - requires courseId and chapterId
    startAttempt: async (assessmentId, courseId, chapterId) => {
        if (!assessmentId || !courseId || !chapterId) {
            throw new Error("Assessment ID, Course ID, and Chapter ID are required");
        }
        
        try {
            console.log(`Starting assessment attempt:`, { assessmentId, courseId, chapterId });
            const response = await axiosInstance.post(`/assessment/${assessmentId}/attempts`, {
                courseId, 
                chapterId
            });
            console.log('Attempt started successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error("Error starting assessment attempt:", error);
            
            // Enhanced error handling specifically for maximum attempts
            if (error.maxAttemptsReached || 
                (error.response && error.response.status === 403 && 
                 error.response.data?.message?.includes('maximum number of attempts'))) {
                
                // Try to fetch previous attempts to help users recover
                try {
                    console.log("Getting previous attempts for reference...");
                    const attemptsResponse = await axiosInstance.get(`/assessment/${assessmentId}/attempts`, {
                        params: { courseId, chapterId }
                    });
                    
                    if (attemptsResponse.data && attemptsResponse.data.attempts) {
                        // Enhance the error with previous attempts data
                        error.previousAttempts = attemptsResponse.data.attempts;
                        error.maxAttemptsInfo = {
                            maxAttempts: attemptsResponse.data.assessment?.max_attempts || 1,
                            passingScore: attemptsResponse.data.assessment?.passing_score || 70
                        };
                        
                        // Find best attempt
                        if (attemptsResponse.data.attempts.length > 0) {
                            error.bestAttempt = attemptsResponse.data.attempts.reduce((best, current) => 
                                (current.score > best.score) ? current : best, attemptsResponse.data.attempts[0]);
                        }
                        
                        error.userFriendlyMessage = `You've already used all ${error.maxAttemptsInfo.maxAttempts} attempts for this quiz.`;
                        if (error.bestAttempt) {
                            error.userFriendlyMessage += ` Your best score was ${error.bestAttempt.score}%.`;
                        }
                    }
                } catch (attemptsError) {
                    console.error("Error fetching previous attempts:", attemptsError);
                }
                
                throw error;
            }
            
            // If the error is a 404, try a different endpoint format
            if (error.response && error.response.status === 404) {
                try {
                    // Try alternative endpoint format
                    console.log(`Retrying with alternative endpoint for assessment attempt`);
                    const retryResponse = await axiosInstance.post(`/assessment/attempts`, {
                        assessmentId,
                        courseId, 
                        chapterId
                    });
                    console.log('Attempt started successfully from alternative endpoint:', retryResponse.data);
                    return retryResponse.data;
                } catch (retryError) {
                    console.error("Error in retry attempt start:", retryError);
                    
                    // Check for 403 error in the retry attempt specifically for maximum attempts
                    if (retryError.maxAttemptsReached || 
                        (retryError.response && retryError.response.status === 403 && 
                         retryError.response.data?.message?.includes('maximum number of attempts'))) {
                        
                        // Try to fetch previous attempts
                        try {
                            console.log("Getting previous attempts for reference (retry)...");
                            const attemptsResponse = await axiosInstance.get(`/assessment/${assessmentId}/attempts`, {
                                params: { courseId, chapterId }
                            });
                            
                            if (attemptsResponse.data && attemptsResponse.data.attempts) {
                                retryError.previousAttempts = attemptsResponse.data.attempts;
                                retryError.maxAttemptsInfo = {
                                    maxAttempts: attemptsResponse.data.assessment?.max_attempts || 1,
                                    passingScore: attemptsResponse.data.assessment?.passing_score || 70
                                };
                                
                                // Find best attempt
                                if (attemptsResponse.data.attempts.length > 0) {
                                    retryError.bestAttempt = attemptsResponse.data.attempts.reduce((best, current) => 
                                        (current.score > best.score) ? current : best, attemptsResponse.data.attempts[0]);
                                }
                                
                                retryError.userFriendlyMessage = `You've already used all ${retryError.maxAttemptsInfo.maxAttempts} attempts for this quiz.`;
                                if (retryError.bestAttempt) {
                                    retryError.userFriendlyMessage += ` Your best score was ${retryError.bestAttempt.score}%.`;
                                }
                            }
                        } catch (attemptsError) {
                            console.error("Error fetching previous attempts (retry):", attemptsError);
                        }
                    }
                    
                    throw retryError;
                }
            }
            
            throw error;
        }
    },

    // Submit an assessment attempt with answers and optional timeTaken
    submitAttempt: async (attemptId, answers, timeTaken) => {
        if (!attemptId) {
            throw new Error("Attempt ID is required");
        }
        
        try {
            console.log(`Submitting attempt ${attemptId} with ${answers.length} answers`);
            console.log('Answers:', JSON.stringify(answers));
            
            // Format the answers properly
            const formattedAnswers = answers.map(answer => ({
                question_id: answer.question_id,
                selected_options: answer.selected_options
            }));
            
            const data = { 
                answers: formattedAnswers
            };
            
            // Only add timeTaken if it's defined
            if (timeTaken !== undefined) {
                data.timeTaken = timeTaken;
            }
            
            console.log('Request data:', JSON.stringify(data));
            
            const response = await axiosInstance.put(`/assessment/attempts/${attemptId}`, data);
            console.log('Submission response:', response.data);
            return response.data;
        } catch (error) {
            console.error("Error submitting assessment attempt:", error);
            throw error;
        }
    },

    // Get user's assessment attempts - requires courseId and chapterId as query params
    getUserAttempts: async (assessmentId, courseId, chapterId) => {
        try {
            console.log(`Fetching attempts for assessment ${assessmentId}`, { courseId, chapterId });
            const response = await axiosInstance.get(`/assessment/${assessmentId}/attempts`, {
                params: { courseId, chapterId }
            });
            console.log('User attempts received:', response.data);
            return response.data;
        } catch (error) {
            console.error("Error fetching user assessment attempts:", error);
            throw error;
        }
    }
};

export default Assessment_API; 