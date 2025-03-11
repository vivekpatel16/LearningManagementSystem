import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaVideo, FaFileAlt, FaGripLines } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const CourseDetail = () => {
  const navigate = useNavigate();
  
  const [chapters, setChapters] = useState([
    {
      id: "chapter-1",
      title: "Course Introduction",
      items: [
        { id: "item-1", title: "Welcome To This Course", type: "video" },
        { id: "item-2", title: "READ BEFORE YOU START!", type: "document" },
      ],
    },
    {
      id: "chapter-2",
      title: "React Basics",
      items: [
        { id: "item-3", title: "Introduction to React", type: "video" },
        { id: "item-4", title: "JSX & Components", type: "video" },
      ],
    },
    {
      id: "chapter-3",
      title: "Advanced React",
      items: [
        { id: "item-5", title: "State Management", type: "video" },
        { id: "item-6", title: "React Hooks", type: "video" },
      ],
    },
  ]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, type } = result;

    if (type === "chapter") {
      const updatedChapters = [...chapters];
      const [movedChapter] = updatedChapters.splice(source.index, 1);
      updatedChapters.splice(destination.index, 0, movedChapter);
      setChapters(updatedChapters);
    } else if (type === "items") {
      const sourceChapterIndex = chapters.findIndex((ch) => ch.id === source.droppableId);
      const destChapterIndex = chapters.findIndex((ch) => ch.id === destination.droppableId);

      if (sourceChapterIndex !== -1 && destChapterIndex !== -1) {
        const updatedChapters = [...chapters];
        const [movedItem] = updatedChapters[sourceChapterIndex].items.splice(source.index, 1);
        updatedChapters[destChapterIndex].items.splice(destination.index, 0, movedItem);
        setChapters(updatedChapters);
      }
    }
  };

  return (
    <div className="container mt-4">
      {/* Title & Add Chapter Button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Course Details</h2>
        <button className="btn btn-primary" onClick={() => navigate("/chaptermanagement")}>
          + Add Chapter
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="chapters" type="chapter">
          {(provided) => (
            <div className="accordion" id="courseAccordion" ref={provided.innerRef} {...provided.droppableProps}>
              {chapters.map((chapter, chapterIndex) => (
                <Draggable key={chapter.id} draggableId={chapter.id} index={chapterIndex}>
                  {(provided) => (
                    <div className="accordion-item" ref={provided.innerRef} {...provided.draggableProps}>
                      <h2 className="accordion-header" id={`heading-${chapter.id}`}>
                        <div className="d-flex align-items-center">
                          <span {...provided.dragHandleProps} className="me-2">
                            <FaGripLines className="text-muted" />
                          </span>
                          <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target={`#collapse-${chapter.id}`}
                            aria-expanded="false"
                            aria-controls={`collapse-${chapter.id}`}
                          >
                            {chapter.title}
                          </button>
                        </div>
                      </h2>
                      <div
                        id={`collapse-${chapter.id}`}
                        className="accordion-collapse collapse"
                        aria-labelledby={`heading-${chapter.id}`}
                      >
                        <div className="accordion-body">
                          <Droppable droppableId={chapter.id} type="items">
                            {(provided) => (
                              <ul className="list-group" ref={provided.innerRef} {...provided.droppableProps}>
                                {chapter.items.map((item, itemIndex) => (
                                  <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                                    {(provided) => (
                                      <li
                                        className="list-group-item d-flex justify-content-between align-items-center"
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                      >
                                        <div className="d-flex align-items-center">
                                          <FaGripLines className="me-2 text-muted" />
                                          {item.type === "video" ? (
                                            <FaVideo className="me-2 text-primary" />
                                          ) : (
                                            <FaFileAlt className="me-2 text-warning" />
                                          )}
                                          {item.title}
                                        </div>
                                      </li>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </ul>
                            )}
                          </Droppable>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default CourseDetail;
