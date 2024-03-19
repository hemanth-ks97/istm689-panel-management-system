import React, { useState, useEffect } from "react";

import { Typography, TextField, Button } from "@mui/material";
import { httpClient } from "../../../client";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import { useLocation, useParams } from "react-router-dom";
import LoadingSpinner from "../../widgets/LoadingSpinner";
import QuestionList from "../../widgets/QuestionList";

const QuestionsPage = () => {
  const { pathname } = useLocation();
  const { panelId } = useParams();
  const { user } = useSelector((state) => state.user);
  const [questions, setQuestions] = useState("");
  const [noOfQuestions, setNoOfQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  useEffect(() => {
    httpClient
      .get(`/panel/${panelId}`, {
        headers,
      })
      .then((response) => {
        // Convert NumberOfQuestions to a Number
        const numberOfQuestions = Number(response.data.NumberOfQuestions);
        setNoOfQuestions(numberOfQuestions);
        setQuestions(Array(numberOfQuestions).fill(""));
        setLoading(false);
      })
      .catch((error) => {
        enqueueSnackbar(error.message, {
          variant: "error",
        });
        setLoading(false);
      });
  }, [panelId]);

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const handleOnSubmit = () => {
    questions.forEach((question, index) => {
      httpClient
        .post(
          `/question`,
          {
            panelId,
            question,
          },
          { headers }
        )
        .then((response) => {
          enqueueSnackbar(response?.data?.message, { variant: "success" });
        })
        .catch((error) => {
          enqueueSnackbar(error.message, { variant: "error" });
        });
    });
    // Reset questions after submitting
    setQuestions(Array(noOfQuestions).fill(""));
  };

  let items;

  if (loading) {
    return <LoadingSpinner />;
  }

  if (pathname.endsWith("questions") && panelId) {
    items = <QuestionList panelId={panelId} />;
  }

  if (pathname.endsWith("question")) {
    items = (
      <>
        <Typography variant="h4">QuestionsPage component</Typography>
        {questions.map((q, index) => (
          <TextField
            key={index}
            id={`question${index}`}
            label={`Question ${index + 1}`}
            placeholder="Please write your question"
            multiline
            variant="filled"
            value={q}
            onChange={(e) => handleQuestionChange(index, e.target.value)}
            fullWidth
            margin="normal"
          />
        ))}
        <p></p>
        <Button variant="contained" color="primary" onClick={handleOnSubmit}>
          Submit
        </Button>{" "}
      </>
    );
  }
  return <>{items}</>;
};

export default QuestionsPage;
