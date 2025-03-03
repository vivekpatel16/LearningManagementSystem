const Chapter = require("../models/chapterModel");
const Course = require("../models/coursesInfoModel");

exports.addChapter = async (req, res) => {
    try {
        const { chapter_title, chapter_description, course_id } = req.body;
        console.log(req.body);

        // Corrected validation check
        if (!chapter_title || !course_id) {
            return res.status(400).json({ message: "Chapter title and course ID are required!" });
        }

        // Check if course exists
        const course = await Course.findById(course_id);
        if (!course) {
            return res.status(404).json({ message: "Course not found!" });
        }

        // Get last chapter order to maintain sequence
        const lastChapter = await Chapter.findOne({ course_id }).sort({ order: -1 });
        const newOrder = lastChapter ? lastChapter.order + 1 : 1;

        // Create new chapter
        const newChapter = new Chapter({
            chapter_title,
            chapter_description,
            order: newOrder,
            course_id
        });

        await newChapter.save();

        return res.status(201).json({ message: "Chapter added successfully", chapter: newChapter });

    } catch (error) {
        console.error("Server error while adding chapters", error);
        return res.status(500).json({ message: "Server error while adding chapter" });
    }
};
