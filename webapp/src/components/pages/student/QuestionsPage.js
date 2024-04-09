import React, { useState, useEffect } from "react";

import { Typography, TextField, Button, Box } from "@mui/material";
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
    // clean up questions without text
    // dont send empty questions!
    const q = questions.filter((question) => question.trim() !== "");
    let data = {
      panelId,
      questions: q,
    };
    httpClient
      .post("/question/batch", data, { headers })
      .then((response) => {
        const { data } = response;

        if (data?.error) {
          enqueueSnackbar(data.error, {
            variant: "error",
          });
        } else {
          enqueueSnackbar(data.message, {
            variant: "success",
          });
        }
        // Reset questions after submitting
        setQuestions(Array(noOfQuestions).fill(""));
      })
      .catch((error) => {
        console.log(error);
        enqueueSnackbar(error.message, { variant: "error" });
      });
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
      <Box flex={1} id={"Box"}>
        <Typography
          variant="h5"
          mt={3}
          textAlign="center"
          sx={{ fontFamily: "monospace", fontWeight: "bold" }}
        >
          Submit your Questions
        </Typography>
        {questions.map((q, index) => (
          <div>
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
              sx={{ flex: 1, m: 2, width: "95%" }}
              margin="normal"
            />
          </div>
        ))}
        <Button
          sx={{ flex: 1, m: 2, marginRight: "10%" }}
          variant="contained"
          color="primary"
          onClick={handleOnSubmit}
        >
          Submit
        </Button>{" "}
      </Box>
    );
  }
  return <>{items}</>;
};

export default QuestionsPage;
