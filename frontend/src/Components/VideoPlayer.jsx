import React from "react";
import { useLocation } from "react-router-dom";
import { Button } from "react-bootstrap";
import { FaPlayCircle, FaRedo, FaExpand } from "react-icons/fa";

const VideoPlayer = () => {
    const location = useLocation();
    const videoData = location.state?.videoData || {
        title: "Sample Video",
        url: "https://www.w3schools.com/html/mov_bbb.mp4", // Example video
        duration: "3 min",
    };

    return (
        <div className="container-fluid p-3" style={{ backgroundColor: "#1c1e21", color: "white" }}>
            <div className="row">
                {/* Video Player Section */}
                <div className="col-md-9">
                    <video controls width="100%" style={{ borderRadius: "10px" }}>
                        <source src={videoData.url} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>

                    {/* Video Controls */}
                    <div className="d-flex align-items-center mt-2">
                        <Button variant="outline-light" size="sm" className="me-2">
                            <FaRedo /> Restart
                        </Button>
                        <Button variant="outline-light" size="sm">
                            <FaExpand /> Full Screen
                        </Button>
                    </div>

                    {/* Video Title */}
                    <h3 className="mt-3">{videoData.title}</h3>
                </div>

                {/* Course Content Section */}
                <div className="col-md-3 bg-dark p-3 rounded">
                    <h5 className="fw-bold">Course Content</h5>
                    <ul className="list-unstyled">
                        <li className="mb-2">
                            <input type="checkbox" className="me-2" checked readOnly /> Introduction - 3 min
                        </li>
                        <li className="mb-2">
                            <input type="checkbox" className="me-2" /> Web Design Basics - 5 min
                        </li>
                        <li className="mb-2">
                            <input type="checkbox" className="me-2" /> UI/UX Principles - 4 min
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
