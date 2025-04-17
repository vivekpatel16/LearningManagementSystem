import { useEffect } from 'react';
import { useSelector } from 'react-redux';

const TidioChat = () => {
  const { user } = useSelector((state) => state.auth);
  
  useEffect(() => {
    // Only load Tidio for users with the "user" role
    if (user && user.role === "user") {
      // Create script element
      const script = document.createElement('script');
      script.src = "//code.tidio.co/4gh4wzkfuboxq3mryepoo6kogsdnvb7w.js";
      script.async = true;
      
      // Append to document body
      document.body.appendChild(script);
      
      // Cleanup function to remove the script when component unmounts
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
        
        // Remove Tidio chat if it was loaded
        if (window.tidioChatApi) {
          window.tidioChatApi.hide();
          window.tidioChatApi.close();
        }
      };
    }
  }, [user]); // Re-run effect if user changes
  
  // Component doesn't render anything visible
  return null;
};

export default TidioChat; 