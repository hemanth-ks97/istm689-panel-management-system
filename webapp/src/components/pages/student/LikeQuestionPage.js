import React, { useState } from "react";
import { Box, Button } from "@mui/material";
import QuestionCard from "../../widgets/QuestionCard";
import LoadingSpinner from "../../widgets/LoadingSpinner";
import { httpClient } from "../../../client";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";

const LikeQuestionPage = ({ questions }) => {

   const initialQuestions = Object.entries(questions).map(([id, text]) => ({
    id: id,
    text: text,
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

  const handleQuestionUpdate = (id, type) => {
    setQuestionData((currentData) =>
      currentData.map((question) => {
        if (question.id === id) {
          
          const updatedQuestion = { ...question, isLiked: false, isDisliked: false, isFlagged: false };
          updatedQuestion[type] = !question[type];  
          return updatedQuestion;
        }
        return question;
      })
    );
  };
  

  const buildRequestBody = (likedQuestions, dislikedQuestions, flaggedQuestions) => {
    return {
      "liked": likedQuestions,
      "disliked": dislikedQuestions,
      "flagged": flaggedQuestions
    }
  }
  const handleSubmitLike = () => {
    const likedQuestions = questionData.filter((q) => q.isLiked).map(q => q.id);
    const dislikedQuestions = questionData.filter((q) => q.isDisliked).map(q => q.id);
    const flaggedQuestions = questionData.filter((q) => q.isFlagged).map(q => q.id);

    const requestBody = buildRequestBody(likedQuestions, dislikedQuestions, flaggedQuestions);

    setLoading(true);

    // make api call

    httpClient
      .post(`/panel/${panelId}/tagging`, requestBody, {
        headers: headers,
      })
      .then((response) => {      
        enqueueSnackbar("Activity recorded", {
          variant: "success",
        })
        setQuestionData([]);
      })
      .catch((error) =>
        enqueueSnackbar(error.message, {
          variant: "error",
        })
      )
      .finally(() => setLoading(false));

  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div>
        {questionData.map((question, idx) => {
          const questionProps = {
            ...question,
            questionNumber: idx + 1,
            onUpdate: handleQuestionUpdate,
          };
          return (
            <div key={question.id}>
              <QuestionCard {...questionProps} />
            </div>
          );
        })}
      </div>

      <div>
        <Button variant="contained" color="primary" onClick={handleSubmitLike}>
          Submit Liked Questions
        </Button>
      </div>
    </Box>
  );
};

export default LikeQuestionPage;
