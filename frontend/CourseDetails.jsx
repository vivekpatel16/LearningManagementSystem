import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaVideo, FaFileAlt, FaGripLines } from "react-icons/fa";
import { Accordion, Button, ListGroup, Container, Row, Col } from "react-bootstrap";

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
    <Container className="mt-4">
      {/* Title & Add Chapter Button */}
      <Row className="mb-3">
        <Col>
          <h2>Course Details</h2>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => navigate("/chaptermanagement")}>
            + Add Chapter
          </Button>
        </Col>
      </Row>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="chapters" type="chapter">
          {(provided) => (
            <Accordion alwaysOpen ref={provided.innerRef} {...provided.droppableProps}>
              {chapters.map((chapter, chapterIndex) => (
                <Draggable key={chapter.id} draggableId={chapter.id} index={chapterIndex}>
                  {(provided) => (
                    <Accordion.Item ref={provided.innerRef} {...provided.draggableProps} eventKey={chapterIndex.toString()}>
                      <Accordion.Header>
                        <div className="d-flex align-items-center">
                          <span {...provided.dragHandleProps} className="me-2">
                            <FaGripLines className="text-muted" />
                          </span>
                          {chapter.title}
                        </div>
                      </Accordion.Header>
                      <Accordion.Body>
                        <Droppable droppableId={chapter.id} type="items">
                          {(provided) => (
                            <ListGroup ref={provided.innerRef} {...provided.droppableProps}>
                              {chapter.items.map((item, itemIndex) => (
                                <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                                  {(provided) => (
                                    <ListGroup.Item
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="d-flex align-items-center"
                                    >
                                      <FaGripLines className="me-2 text-muted" />
                                      {item.type === "video" ? (
                                        <FaVideo className="me-2 text-primary" />
                                      ) : (
                                        <FaFileAlt className="me-2 text-warning" />
                                      )}
                                      {item.title}
                                    </ListGroup.Item>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </ListGroup>
                          )}
                        </Droppable>
                      </Accordion.Body>
                    </Accordion.Item>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Accordion>
          )}
        </Droppable>
      </DragDropContext>
    </Container>
  );
};

export default CourseDetail;
