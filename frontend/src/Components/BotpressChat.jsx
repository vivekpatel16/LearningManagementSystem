import { useEffect } from 'react';
import { useSelector } from 'react-redux';

const BotpressChat = () => {
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user && user.role === 'admin') {
      // Step 1: Load inject.js first
      const injectScript = document.createElement('script');
      injectScript.src = 'https://cdn.botpress.cloud/webchat/v2.4/inject.js';
      injectScript.async = true;

      injectScript.onload = () => {
        // Step 2: Load config script after inject.js is ready
        const configScript = document.createElement('script');
        configScript.src = 'https://files.bpcontent.cloud/2025/05/05/06/20250505064747-3611RV9S.js';
        configScript.async = true;
        document.body.appendChild(configScript);
      };

      document.body.appendChild(injectScript);

      // Cleanup
      return () => {
        if (document.body.contains(injectScript)) {
          document.body.removeChild(injectScript);
        }
        const configScripts = document.querySelectorAll(
          'script[src="https://files.bpcontent.cloud/2025/05/05/06/20250505064747-3611RV9S.js"]'
        );
        configScripts.forEach((s) => document.body.removeChild(s));

        if (window.botpressWebChat) {
          window.botpressWebChat.hide();
          window.botpressWebChat.close();
        }
      };
    }
  }, [user]);

  return null;
};

export default BotpressChat;
