const axios = require('axios');
const { MongoClient } = require('mongodb');

exports.generateQueryFromPrompt = async(prompt) => {
    const enhancedPrompt = `
  You are an expert MongoDB assistant for an LMS (Learning Management System). Your job is to translate an **admin's natural language prompt** into a **MongoDB query** that strictly fetches data. You are NOT allowed to generate queries that perform **insert**, **update**, or **delete** operations.
  
  🔒 Only return queries that use **find** or **aggregate** (read-only).
  🔍 Use aggregation when multiple collections must be joined using $lookup or if grouping/sorting is required.
  🧠 Be smart about which collection is the main one. Use $match, $group, $project, $sort appropriately.
  🛑 Return your answer in this exact JSON format only:
  {
    "collection": "<collection_name>",
    "query": <valid MongoDB query or aggregation array>,
    "type": "find" or "aggregate"
  }
  
  You must respond with:
  - A valid **MongoDB collection** name as the "collection"
  - A valid MongoDB **query or aggregation pipeline** in the "query"
  - The "type" must be either "find" or "aggregate"
  
  If the admin's prompt is unclear, return this exact JSON:
  { "error": "Could not understand the prompt clearly enough to generate a MongoDB query." }
  
  Schemas available in the LMS:
  ${promptSchemas()} 
  
  Admin Prompt: """${prompt}"""
  `;
  
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.LLM_API_KEY}`,
      {
        contents: [{ parts: [{ text: enhancedPrompt }] }],
      }
    );
  
    const textResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
  
    if (!textResponse) {
      throw new Error('No response from Gemini model');
    }
  
    let cleaned = textResponse.trim();
  
    // Remove triple backticks and language label if present
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```(?:json)?\n?/, '').replace(/```$/, '').trim();
    }
    
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      throw new Error('Gemini returned invalid JSON: ' + textResponse);
    }
    
  
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.collection ||
      !parsed.query ||
      !parsed.type ||
      !['find', 'aggregate'].includes(parsed.type)
    ) {
      throw new Error('Invalid query structure returned from Gemini: ' + JSON.stringify(parsed));
    }
  
    return parsed;
  }

exports.executeMongoQuery = async(collectionName, query, type) => {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db();
  
    const collection = db.collection(collectionName);
  
    let result;
    if (type === 'find') {
      result = await collection.find(query).toArray();
    } else if (type === 'aggregate') {
      result = await collection.aggregate(query).toArray();
    } else {
      throw new Error('Invalid query type. Only "find" or "aggregate" are supported.');
    }
  
    await client.close();
    return result;
  }

exports.formatResultWithGemini = async(adminPrompt, mongoResult) => {
    const formatPrompt = `
      You are an intelligent assistant for an LMS. Based on the **admin's original prompt** and the **MongoDB query result**, generate a clean, readable, and useful response for the admin.
  
      Instructions:
      - Format the data in **natural language** or **tabular form**.
      - Highlight the **most relevant information** clearly.
      - Avoid raw MongoDB formatting like ObjectIds or timestamps unless necessary.
      - If the result is an array of objects, present it like a table.
      - If no results were found, say "No results found for this query."
  
      Admin's Prompt: """${adminPrompt}"""
  
      MongoDB Result:
    ${JSON.stringify(mongoResult, null, 2)}
    `;
  
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.LLM_API_KEY}`,
      {
        contents: [{ parts: [{ text: formatPrompt }] }],
      }
    );
  
    const formatted = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
  
    if (!formatted) {
      throw new Error('No formatting response from Gemini');
    }
  
    return formatted.trim();
  }

function promptSchemas() {
    return `
        userinfos: [_id(Mongo Object_id), user_name, password, email, role("instructor" or "admin" or "user"), user_image, createdAt(autoset by mongo), updatedAt(autoset by mongo)]
        Example: { "_id": "67c0382c49c7f4ac5f3a1996", "user_name": "John Doe", "email": "test@example.com", "role": "user", "createdAt": "2025-03-06T06:58:48.824+00:00", "updatedAt": "2025-04-16T15:15:33.633+00:00" }

        categories: [_id(Mongo Object_id), category_name, createdAt(autoset by mongo), updatedAt(autoset by mongo)]
        Example: { "_id": "67bbfc9e4be6650679312048", "category_name": "Software Development", "createdAt": "2025-03-06T06:58:48.824+00:00", "updatedAt": "2025-04-16T15:15:33.633+00:00" }

        coursesinfos: [_id(Mongo Object_id), title, description, category_id(Refernce object id from categories schema), thumbnail, created_by(Refrence object id from userinfos schema), status(true(active) or false(deactive)), createdAt(autoset by mongo), updatedAt(autoset by mongo)]
        Example: { "_id": "67c947a84699fc8ff4782b8b", "title": "React Course", "created_by": "67c0382149c7f4ac5f3a1993", "description": "A comprehensive guide to building scalable applications with React.js.","category_id": "67bbfc9e4be6650679312048", "status": "true", "createdAt": "2025-03-06T06:58:48.824+00:00", "updatedAt": "2025-04-16T15:15:33.633+00:00" }

        videousers: [_id(Mongo Object_id), course_id(Refrence object id from coursesinfos schema), user_id(Refrence object id from userinfos schema), video_id(Refrence object id from videoinfos schema), current_time(in seconds), progress_percent, completed(true or false), createdAt(autoset by mongo), updatedAt(autoset by mongo)]
        Example: { "_id": "67e5369f958ed368d3e4adbe", "course_id": "67c947a84699fc8ff4782b8b", "user_id": "67c0382c49c7f4ac5f3a1996", "video_id": "67da94f274e8c2051f1ac40e", "current_time": 311.104923, "progress_percent": 52.324341928502335, "completed": true, "createdAt": "2025-03-06T06:58:48.824+00:00", "updatedAt": "2025-04-16T15:15:33.633+00:00" }

        chapters: [_id(Mongo Object_id), chapter_title, chapter_description, course_id(Refrence object id from coursesinfos schema), order(0,1,2.. likewise), createdAt(autoset by mongo), updatedAt(autoset by mongo)]
        Example: { "_id": "67c6cbd7aed1b414749a7b69", "chapter_title": "Intro to React", "chapter_description": "This chapter covers the basics of JavaScript, including variables, functions, and loops.", "course_id": "67c947a84699fc8ff4782b8b", "order": 1, "createdAt": "2025-03-06T06:58:48.824+00:00", "updatedAt": "2025-04-01" }

        chaptercontents: [_id(Mongo Object_id), chapter_id(Refernce object id from chapters schema), content_id(Refernce object id from (videoinfos or documents or assessments) schema), content_type_ref, order(0,1,2.. likewise), createdAt(autoset by mongo), updatedAt(autoset by mongo)]
        Example: { "_id": "6805ced1a0b1762760fad7a6", "chapter_id": "67c6cbd7aed1b414749a7b69", "content_id": "67da94f274e8c2051f1ac40e", "content_type_ref": "VideoInfo", "order": 1, "createdAt": "2025-03-06T06:58:48.824+00:00", "updatedAt": "2025-04-16T15:15:33.633+00:00" }

        videoinfos: [_id(Mongo Object_id), video_url, video_title, video_description, video_length, video_thumbnail(in second), createdAt(autoset by mongo), updatedAt(autoset by mongo)]
        Example: { "_id": "67da94f274e8c2051f1ac40e", "video_url": "http://example.com/video.mp4", "video_title": "React Basics", "video_description": "Learn React Basics", "video_length": 300, "createdAt": "2025-03-06T06:58:48.824+00:00", "updatedAt": "2025-04-16T15:15:33.633+00:00" }

        documents: [_id(Mongo Object_id), pdf_url, pdf_title, createdAt(autoset by mongo), updatedAt(autoset by mongo)]
        Example: { "_id": "67da94f274e8c2051f1ac40e", "pdf_url": "uploads/pdfs/1745488005595-834161295.pdf", "pdf_title": "React Basics", "createdAt": "2025-03-06T06:58:48.824+00:00", "updatedAt": "2025-04-16T15:15:33.633+00:00" }

        assessments: [_id(Mongo Object_id), title, description, questions(Nested Array of object), passing_score, time_limit(in seconds), isPublished(true or false), max_attempts(0,1,2.. likewise), createdAt(autoset by mongo), updatedAt(autoset by mongo)]
        Example: { "_id": "67fcf69c6f91178682d884ad", "title": "React test", "course_id": "67c947a84699fc8ff4782b8b", "chapter_id": "67c6cbd7aed1b414749a7b69", "questions": [
        {
            "question_text": "What is JSX?",
            "options": [
            { "text": "A way to write HTML in JS", "isCorrect": "true" },
            { "text": "A CSS preprocessor", "isCorrect": "false" },
            { "text": "A backend framework", "isCorrect": "false" }
            ],
            "points": 1,
            "order": 1
        }
        ], "description": "React Basics Quiz", "passing_score": 70, "time_limit": 300, "max_attempts": 2, "isPublished": "true", "createdAt": "2025-03-06T06:58:48.824+00:00", "updatedAt": "2025-04-16T15:15:33.633+00:00" }

        assessmentattempts: [_id(Mongo Object_id), user_id(Refrence object id from userinfos schema), assessment_id(Refrence object id from assessments schema), course_id(Refrence object id from coursesinfos schema), chapter_id(Refernce object id from chapters schema), attempt_number(0,1,2.. likewise), attempts_remaining(0,1,2.. likewise), answers, score(out of 100), passed(true or false), time_taken(in seconds), completed(true or false), date_completed(datetime), createdAt(autoset by mongo), updatedAt(autoset by mongo)]
        Example: { "_id": "68062ea0fb214653ff21d005", "user_id": "67c0382c49c7f4ac5f3a1996", "assessment_id": "67fcf69c6f91178682d884ad", "course_id": "67c947a84699fc8ff4782b8b", "chapter_id": "67c6cbd7aed1b414749a7b69", "attempt_number": 1, "attempts_remaining": 0, "answers": [
        {
        "question_index": 1,
        "selected_options": "[0]",
        "is_correct": "true"
        }
        ], "score": 100, "time_taken": 20, "passed": "true", "date_completed": "2025-04-21T11:40:34.865+00:00", "createdAt": "2025-03-06T06:58:48.824+00:00", "updatedAt": "2025-04-16T15:15:33.633+00:00" }

        courseratings: [_id(Mongo Object_id), user_id(Refrence object id from userinfos schema), course_id(Refrence object id from coursesinfos schema), rating(0 to 5), createdAt(autoset by mongo), updatedAt(autoset by mongo)]
        Example: { "_id": "67e25a2bcdffed340b953187", "user_id": "67c0382c49c7f4ac5f3a1996", "course_id": "67c947a84699fc8ff4782b8b", "rating": 5, "createdAt": "2025-03-06T06:58:48.824+00:00", "updatedAt": "2025-04-16T15:15:33.633+00:00" }

        otps: [_id(Mongo Object_id), user_id(Refrence object id from userinfos schema), email(is it exists in userinfos schema), otp(6 digit number), expiresAt(10 mins more than createdAt time), createdAt(autoset by mongo), updatedAt(autoset by mongo)]
        Example: { "_id": "6811d3d9cca2ac60d10fe112", "user_id": "67c0382c49c7f4ac5f3a1996", "email": "test@gmail.com", "otp": 232238, "expiresAt": "2025-04-30T07:50:09.631+00:00", "createdAt": "2025-04-30T07:40:09.646+00:00", "updatedAt": "2025-04-30T07:40:09.646+00:00" }

        comments: [_id(Mongo Object_id), user_id(Refrence object id from userinfos schema), video_id(Refrence object id from videoinfos schema), comment, createdAt(autoset by mongo), updatedAt(autoset by mongo)]
        Example: { "_id": "67e503640d9c1f17108facea", "user_id": "67c0382c49c7f4ac5f3a1996", "video_id": "67da94f274e8c2051f1ac40e", "comment": "Hello it is very good video", "createdAt": "2025-03-06T06:58:48.824+00:00", "updatedAt": "2025-04-16T15:15:33.633+00:00" }

        wishlists: [_id(Mongo Object_id), user_id(Refrence object id from userinfos schema), course_id(Refrence object id from coursesinfos schema), createdAt(autoset by mongo), updatedAt(autoset by mongo)]
        Example: { "_id": "67e26c5ac4bafbd1bf2978b3", "user_id": "67c0382c49c7f4ac5f3a1996", "course_id": "67c947a84699fc8ff4782b8b", "createdAt": "2025-03-06T06:58:48.824+00:00", "updatedAt": "2025-04-16T15:15:33.633+00:00" }

    `;
    }