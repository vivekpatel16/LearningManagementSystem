const ChapterContent = require('../models/chapterContentModel');
const Chapter = require('../models/chapterModel');
const Video = require('../models/videoModel');
const Document = require('../models/documentModel');
const Assessment = require('../models/assessmentModel');
const asyncHandler = require('express-async-handler');

// @desc    Get all content for a chapter
// @route   GET /api/chapters/:chapterId/content
// @access  Public
const getChapterContent = asyncHandler(async (req, res) => {
  const { chapterId } = req.params;

  // Validate chapter exists
  const chapter = await Chapter.findById(chapterId);
  if (!chapter) {
    res.status(404);
    throw new Error('Chapter not found');
  }

  // Get all content for this chapter, sorted by order
  const content = await ChapterContent.find({ chapter_id: chapterId })
    .sort({ order: 1 })
    .lean();

  // Populate content details based on their type
  const populatedContent = await Promise.all(
    content.map(async (item) => {
      let contentDetails = null;

      if (item.content_type_ref === 'VideoInfo') {
        contentDetails = await Video.findById(item.content_id);
      } else if (item.content_type_ref === 'Document') {
        contentDetails = await Document.findById(item.content_id);
      } else if (item.content_type_ref === 'Assessment') {
        contentDetails = await Assessment.findById(item.content_id);
      }

      return {
        ...item,
        contentDetails,
        type: item.content_type_ref
      };
    })
  );

  // Format response to match frontend expectations
  res.status(200).json({
    success: true,
    contents: populatedContent
  });
});

// @desc    Add content to chapter
// @route   POST /api/chapters/:chapterId/content
// @access  Private (Instructor/Admin)
const addContentToChapter = asyncHandler(async (req, res) => {
  const { chapterId } = req.params;
  const { content_id, content_type_ref } = req.body;

  // Validate chapter exists
  const chapter = await Chapter.findById(chapterId);
  if (!chapter) {
    res.status(404);
    throw new Error('Chapter not found');
  }

  // Validate content exists based on type
  let contentExists = false;
  if (content_type_ref === 'VideoInfo') {
    contentExists = await Video.findById(content_id);
  } else if (content_type_ref === 'Document') {
    contentExists = await Document.findById(content_id);
  } else if (content_type_ref === 'Assessment') {
    contentExists = await Assessment.findById(content_id);
  }

  if (!contentExists) {
    res.status(404);
    throw new Error(`${content_type_ref} not found`);
  }

  // Get the highest current order for this chapter
  const highestOrder = await ChapterContent.findOne({ chapter_id: chapterId })
    .sort({ order: -1 })
    .lean();

  const newOrder = highestOrder ? highestOrder.order + 1 : 1;

  // Create new chapter content entry
  const chapterContent = await ChapterContent.create({
    chapter_id: chapterId,
    content_id,
    content_type_ref,
    order: newOrder,
  });

  res.status(201).json(chapterContent);
});

// @desc    Update content order in chapter
// @route   PUT /api/chapters/content/reorder
// @access  Private (Instructor/Admin)
const reorderChapterContent = asyncHandler(async (req, res) => {
  const { contentOrder } = req.body;

  if (!contentOrder || !Array.isArray(contentOrder)) {
    res.status(400);
    throw new Error('contentOrder array is required');
  }

  // Update order for each content item
  const updatePromises = contentOrder.map(async (item, index) => {
    return ChapterContent.findByIdAndUpdate(
      item.id,
      { order: index + 1 },
      { new: true }
    );
  });

  await Promise.all(updatePromises);

  res.status(200).json({ message: 'Content reordered successfully' });
});

// @desc    Move content between chapters
// @route   PUT /api/chapters/content/move
// @access  Private (Instructor/Admin)
const moveContentBetweenChapters = asyncHandler(async (req, res) => {
  const { contentId, sourceChapterId, destinationChapterId } = req.body;

  if (!contentId || !sourceChapterId || !destinationChapterId) {
    res.status(400);
    throw new Error('contentId, sourceChapterId, and destinationChapterId are required');
  }

  // Check if content exists
  const content = await ChapterContent.findById(contentId);
  if (!content) {
    res.status(404);
    throw new Error('Content not found');
  }

  // Check if source chapter matches
  if (content.chapter_id.toString() !== sourceChapterId) {
    res.status(400);
    throw new Error('Content is not in the specified source chapter');
  }

  // Check if destination chapter exists
  const destinationChapter = await Chapter.findById(destinationChapterId);
  if (!destinationChapter) {
    res.status(404);
    throw new Error('Destination chapter not found');
  }

  // Get the highest order in the destination chapter
  const highestOrder = await ChapterContent.findOne({ chapter_id: destinationChapterId })
    .sort({ order: -1 })
    .lean();

  const newOrder = highestOrder ? highestOrder.order + 1 : 1;

  // Update the content's chapter_id and order
  content.chapter_id = destinationChapterId;
  content.order = newOrder;
  await content.save();

  // Reorder the contents in the source chapter
  const sourceChapterContents = await ChapterContent.find({ chapter_id: sourceChapterId })
    .sort({ order: 1 });
  
  const updatePromises = sourceChapterContents.map(async (item, index) => {
    return ChapterContent.findByIdAndUpdate(
      item._id,
      { order: index + 1 },
      { new: true }
    );
  });

  await Promise.all(updatePromises);

  res.status(200).json({ 
    message: 'Content moved successfully',
    content
  });
});

// @desc    Delete content from chapter
// @route   DELETE /api/chapters/content/:contentId
// @access  Private (Instructor/Admin)
const deleteChapterContent = asyncHandler(async (req, res) => {
  const { contentId } = req.params;

  const content = await ChapterContent.findById(contentId);
  if (!content) {
    res.status(404);
    throw new Error('Content not found');
  }

  await ChapterContent.findByIdAndDelete(contentId);

  res.status(200).json({ message: 'Content removed from chapter' });
});

module.exports = {
  getChapterContent,
  addContentToChapter,
  reorderChapterContent,
  moveContentBetweenChapters,
  deleteChapterContent,
}; 