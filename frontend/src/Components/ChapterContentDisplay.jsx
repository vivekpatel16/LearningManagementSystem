import React, { useState, useEffect } from 'react';
import { getChapterContent, getVideoContentByChapter } from '../Api/videoApi';

/**
 * Component to display chapter content using the ChapterContent API
 * This demonstrates how to fetch and display videos and other content
 */
const ChapterContentDisplay = ({ chapterId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState([]);
  const [videos, setVideos] = useState([]);

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
              <div key={item._id} className="border p-3 rounded">
                <p><strong>Type:</strong> {item.content_type_ref}</p>
                <p><strong>Order:</strong> {item.order}</p>
                
                {item.content_type_ref === 'VideoInfo' && item.contentDetails && (
                  <>
                    <p><strong>Title:</strong> {item.contentDetails.video_title}</p>
                    <p><strong>Description:</strong> {item.contentDetails.video_description}</p>
                    {item.contentDetails.video_url && (
                      <div className="mt-2">
                        <video 
                          controls 
                          width="100%"
                          poster={item.contentDetails.video_thumbnail}
                          className="rounded"
                        >
                          <source src={item.contentDetails.video_url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                  </>
                )}
                
                {item.content_type_ref === 'Document' && item.contentDetails && (
                  <>
                    <p><strong>Title:</strong> {item.contentDetails.pdf_title}</p>
                    <p><strong>Description:</strong> {item.contentDetails.pdf_description}</p>
                    {item.contentDetails.pdf_url && (
                      <div className="mt-2">
                        <a 
                          href={item.contentDetails.pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View Document
                        </a>
                      </div>
                    )}
                  </>
                )}
                
                {item.content_type_ref === 'Assessment' && item.contentDetails && (
                  <>
                    <p><strong>Title:</strong> {item.contentDetails.title}</p>
                    <p><strong>Description:</strong> {item.contentDetails.description}</p>
                    <p><strong>Questions:</strong> {item.contentDetails.questions?.length || 0}</p>
                    <p><strong>Passing Score:</strong> {item.contentDetails.passing_score}</p>
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
              <div key={video._id} className="border p-3 rounded">
                <h4 className="font-medium">{video.video_title}</h4>
                <p className="text-sm text-gray-600 mb-2">{video.video_description}</p>
                <video 
                  controls 
                  width="100%" 
                  poster={video.video_thumbnail}
                  className="rounded"
                >
                  <source src={video.video_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterContentDisplay; 