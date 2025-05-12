import React, { useState, useEffect } from 'react';
import { getChapterContent, getVideoContentByChapter } from '../Api/videoApi';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { FaPlayCircle, FaFileAlt, FaQuestionCircle } from 'react-icons/fa';

/**
 * Component to display chapter content using the ChapterContent API
 * This demonstrates how to fetch and display videos and other content
 */
const ChapterContentDisplay = ({ chapterId, courseId, courseTitle }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState([]);
  const [videos, setVideos] = useState([]);
  const navigate = useNavigate();

  // Fetch all content for the chapter
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Method 1: Get all chapter content
        const chapterContent = await getChapterContent(chapterId);
        setContent(chapterContent || []);
        
        // Method 2: Get only video content
        const videoContent = await getVideoContentByChapter(chapterId);
        setVideos(videoContent || []);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chapter content:', error);
        setError('Failed to load content. Please try again later.');
        setLoading(false);
      }
    };
    
    if (chapterId) {
      fetchContent();
    }
  }, [chapterId]);

  // Handle navigation to appropriate content viewer
  const handleContentClick = (item) => {
    if (item.content_type_ref === 'VideoInfo') {
      // Navigate to video player
      navigate(`/video-player`, {
        state: {
          videoData: item.contentDetails,
          courseId: courseId,
          chapterId: chapterId,
          courseTitle: courseTitle
        }
      });
    } else if (item.content_type_ref === 'Document') {
      // Enhanced logging to help troubleshoot document viewing
      console.log("Document item clicked:", item);
      
      // Prepare the document data with all necessary fields
      const enhancedDocData = {
        ...item.contentDetails,
        // Ensure we have the URL field 
        url: item.contentDetails.pdf_url || item.contentDetails.url,
        pdf_url: item.contentDetails.pdf_url || item.contentDetails.url,
        // Ensure we have the title
        title: item.contentDetails.pdf_title || item.contentDetails.title || "Document",
        pdf_title: item.contentDetails.pdf_title || item.contentDetails.title || "Document",
        // Keep contentId for reference
        contentId: item.contentDetails._id,
        type: "document"
      };
      
      console.log("Enhanced document data:", enhancedDocData);
      
      // Navigate to document viewer
      navigate(`/document-viewer/${item._id}`, {
        state: {
          documentData: enhancedDocData,
          courseId: courseId,
          chapterId: chapterId,
          courseTitle: courseTitle
        }
      });
    } else if (item.content_type_ref === 'Assessment') {
      // Navigate to quiz attempt
      navigate(`/quiz-attempt/${item._id}`, {
        state: {
          quizData: {
            ...item.contentDetails,
            contentId: item.contentDetails._id
          },
          courseId: courseId,
          chapterId: chapterId,
          courseTitle: courseTitle
        }
      });
    }
  };

  if (loading) {
    return <div className="p-4">Loading content...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Chapter Content</h2>
      
      {/* Display all content */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">All Content</h3>
        {content.length === 0 ? (
          <p>No content available for this chapter.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {content.map((item) => (
              <div key={item._id} className="border p-3 rounded hover:bg-gray-50 cursor-pointer transition-colors" 
                   onClick={() => handleContentClick(item)}>
                <div className="flex items-center mb-2">
                  {item.content_type_ref === 'VideoInfo' && (
                    <FaPlayCircle className="text-blue-500 mr-2" size={20} />
                  )}
                  {item.content_type_ref === 'Document' && (
                    <FaFileAlt className="text-orange-500 mr-2" size={20} />
                  )}
                  {item.content_type_ref === 'Assessment' && (
                    <FaQuestionCircle className="text-green-500 mr-2" size={20} />
                  )}
                  <p className="font-medium">
                    <strong>Type:</strong> {item.content_type_ref}
                  </p>
                </div>
                <p><strong>Order:</strong> {item.order}</p>
                
                {item.content_type_ref === 'VideoInfo' && item.contentDetails && (
                  <>
                    <p><strong>Title:</strong> {item.contentDetails.video_title}</p>
                    <p><strong>Description:</strong> {item.contentDetails.video_description}</p>
                    <Button 
                      variant="outline-primary" 
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContentClick(item);
                      }}
                    >
                      <FaPlayCircle className="mr-1" /> Watch Video
                    </Button>
                  </>
                )}
                
                {item.content_type_ref === 'Document' && item.contentDetails && (
                  <>
                    <p><strong>Title:</strong> {item.contentDetails.pdf_title}</p>
                    <p><strong>Description:</strong> {item.contentDetails.pdf_description}</p>
                    <Button 
                      variant="outline-warning" 
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContentClick(item);
                      }}
                    >
                      <FaFileAlt className="mr-1" /> View Document
                    </Button>
                  </>
                )}
                
                {item.content_type_ref === 'Assessment' && item.contentDetails && (
                  <>
                    <p><strong>Title:</strong> {item.contentDetails.title}</p>
                    <p><strong>Description:</strong> {item.contentDetails.description}</p>
                    <p><strong>Questions:</strong> {item.contentDetails.questions?.length || 0}</p>
                    <p><strong>Passing Score:</strong> {item.contentDetails.passing_score}</p>
                    <Button 
                      variant="outline-success" 
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContentClick(item);
                      }}
                    >
                      <FaQuestionCircle className="mr-1" /> Take Quiz
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Display only videos */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Videos Only</h3>
        {videos.length === 0 ? (
          <p>No videos available for this chapter.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((video) => (
              <div key={video._id} className="border p-3 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                   onClick={() => navigate(`/video-player`, {
                      state: {
                        videoData: video,
                        courseId: courseId,
                        chapterId: chapterId,
                        courseTitle: courseTitle
                      }
                    })}>
                <h4 className="font-medium">{video.video_title}</h4>
                <p className="text-sm text-gray-600 mb-2">{video.video_description}</p>
                <div className="relative">
                  <img 
                    src={video.video_thumbnail || "https://via.placeholder.com/640x360?text=Video+Thumbnail"}
                    alt={video.video_title}
                    className="w-full rounded"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FaPlayCircle size={48} className="text-white opacity-80" />
                  </div>
                </div>
                <Button 
                  variant="primary" 
                  className="mt-3 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/video-player`, {
                      state: {
                        videoData: video,
                        courseId: courseId,
                        chapterId: chapterId,
                        courseTitle: courseTitle
                      }
                    });
                  }}
                >
                  <FaPlayCircle className="mr-2" /> Watch Video
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterContentDisplay; 