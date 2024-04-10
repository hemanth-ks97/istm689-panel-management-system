import React, { useState } from "react";
import { Box, Button, Typography, useTheme } from "@mui/material";
import QuestionCard from "../../widgets/QuestionCard";
import LoadingSpinner from "../../widgets/LoadingSpinner";
import { httpClient } from "../../../client";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";

const LikeQuestionPage = ({ questions, onNext }) => {
  const initialQuestions = Object.entries(questions).map(([id, text]) => ({
    id,
    text,
    isLiked: false,
    isDisliked: false,
    isFlagged: false,
  }));

  const { enqueueSnackbar } = useSnackbar();
  const { panelId } = useParams();
  const { user } = useSelector((state) => state.user);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  const [questionData, setQuestionData] = useState(initialQuestions);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 4;
  const totalPages = Math.ceil(questionData.length / questionsPerPage);

  const handleQuestionUpdate = (id, type) => {
    setQuestionData((currentData) =>
      currentData.map((question) => {
        if (question.id === id) {
          const updatedQuestion = {
            ...question,
            isLiked: false,
            isDisliked: false,
            isFlagged: false,
          };
          updatedQuestion[type] = !question[type];
          return updatedQuestion;
        }
        return question;
      })
    );
  };

  const buildRequestBody = (
    likedQuestions,
    dislikedQuestions,
    flaggedQuestions
  ) => {
    return {
      liked: likedQuestions,
      disliked: dislikedQuestions,
      flagged: flaggedQuestions,
    };
  };

  const handleSubmitAndProceed = () => {
    // You can merge your submission logic here before proceeding to the next part
    const likedQuestions = questionData
      .filter((q) => q.isLiked)
      .map((q) => q.id);
    const dislikedQuestions = questionData
      .filter((q) => q.isDisliked)
      .map((q) => q.id);
    const flaggedQuestions = questionData
      .filter((q) => q.isFlagged)
      .map((q) => q.id);

    const requestBody = buildRequestBody(
      likedQuestions,
      dislikedQuestions,
      flaggedQuestions
    );

    setLoading(true);

    httpClient
      .post(`/panel/${panelId}/tagging`, requestBody, {
        headers: headers,
      })
      .then((response) => {
        enqueueSnackbar("Activity recorded", {
          variant: "success",
        });
        setQuestionData([]);
        onNext();
      })
      .catch((error) =>
        enqueueSnackbar(error.message, {
          variant: "error",
        })
      )
      .finally(() => setLoading(false));
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = questionData.slice(
    indexOfFirstQuestion,
    indexOfLastQuestion
  );

  const theme = useTheme();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        padding: 2,
        overflow: "auto",
      }}
    >
      {questionData
        .slice(
          (currentPage - 1) * questionsPerPage,
          currentPage * questionsPerPage
        )
        .map((question, idx) => (
          <QuestionCard
            hideActions={true}
            key={question.id}
            {...question}
            questionNumber={(currentPage - 1) * questionsPerPage + idx + 1}
            onUpdate={handleQuestionUpdate}
          />
        ))}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: "600px",
          mt: 2,
        }}
      >
        <Button
          variant="contained"
          disabled={currentPage === 1}
          onClick={handlePreviousPage}
        >
          Back
        </Button>
        {currentPage < totalPages && (
          <Button variant="contained" onClick={handleNextPage}>
            Next
          </Button>
        )}
        {currentPage === totalPages && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitAndProceed}
          >
            Submit and Proceed
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default LikeQuestionPage;
