import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Box, Paper, Typography, Button } from "@mui/material";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { httpClient } from "../../../client";
import LoadingSpinner from "../../widgets/LoadingSpinner";
import { useSnackbar } from "notistack";
import "./VotingPage.css";
import StrictModeDroppable from "./StrictModeDroppable";

const VotingPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { panelId } = useParams();
  const { user } = useSelector((state) => state.user);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user?.token}`,
    };

    httpClient
      .get(`/panel/${panelId}/questions/voting`, { headers })
      .then((response) => {
        const fetchedQuestions = response.data.question;
        const questionsArray = Object.entries(fetchedQuestions).map(
          ([key, value]) => ({
            id: key.toString(),
            content: value.QuestionText,
          })
        );
        setQuestions(questionsArray);
      })
      .catch((error) => enqueueSnackbar(error.message, { variant: "error" }));

    setLoading(false);
  }, [panelId, user?.token, enqueueSnackbar]);

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const reordered = Array.from(questions);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    setQuestions(reordered);
  };

  const handleSubmit = () => {
    // Process the current state to pair each question's ID with its order (index)
    const orderedQuestions = questions.map((question, index) => ({
      id: question.id,
      order: index,
    }));

    console.log(orderedQuestions);
    // TODO Send the ordered list to a backend server
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box className="voting-page">
      <Typography variant="h4" gutterBottom style={{ textAlign: "center" }}>
        Voting Page
      </Typography>
      <Typography variant="h5" gutterBottom>
        Guidelines: Drag and drop to rank the questions in order of your
        preference, then click submit.
      </Typography>
      <DragDropContext onDragEnd={onDragEnd}>
        <StrictModeDroppable droppableId="droppable-questions">
          {(provided) => (
            <Box
              className="questions-list"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {questions.map(({ id, content }, index) => (
                <>
                  <Typography>Rank #{index + 1}</Typography>
                  <Draggable key={id} draggableId={id} index={index}>
                    {(provided, snapshot) => (
                      <Paper
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        elevation={snapshot.isDragging ? 6 : 1}
                        className={
                          snapshot.isDragging ? "question dragging" : "question"
                        }
                        sx={{ mb: 1, p: 2 }}
                      >
                        <Typography>{content}</Typography>
                      </Paper>
                    )}
                  </Draggable>
                </>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </StrictModeDroppable>
      </DragDropContext>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          sx={{ mt: 2 }}
        >
          Submit Voting
        </Button>
      </Box>
    </Box>
  );
};

export default VotingPage;
