import React, { useState, useEffect } from "react";

import { Typography, TextField, Button, Box, Grid } from "@mui/material";
import { httpClient } from "../../../client";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import LoadingSpinner from "../../widgets/LoadingSpinner";

const QuestionsPage = () => {
  const { user } = useSelector((state) => state.user);
  const { panelId } = useParams();
  const [panelInfo, setPanelInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submittedQuestions, setSubmittedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  useEffect(() => {
    if (!panelId) {
      return;
    }

    const fetchData = async () => {
      const { data: panel } = await httpClient.get(`/panel/${panelId}`, {
        headers,
      });

      setPanelInfo(panel);

      const { data: questionsInServer } = await httpClient.get(
        `/panel/${panelId}/questions/submitted`,
        {
          headers,
        }
      );

      const questionsSubmittedArray = questionsInServer.questions;

      if (questionsSubmittedArray.length > 0) {
        // Student already submitted questions!
        // loop trogh array, and store test only
        setSubmittedQuestions(
          questionsSubmittedArray.map((q) => q.QuestionText)
        );
      } else {
        // Student did not submit questions!
        const numberOfQuestions = panel?.NumberOfQuestions;
        setQuestions(Array(numberOfQuestions).fill(""));
      }
    };

    fetchData()
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const handleOnSubmit = () => {
    // Remove unnecessary white spaces
    const trimmedQuestions = questions.map((q) => q.trim());
    // Remove any question that is just an empty string
    // Prevent from sending empty questions to backend
    const filteredQuestions = trimmedQuestions.filter((q) => q.trim() !== "");

    let data = {
      panelId,
      questions: filteredQuestions,
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
          const filteredQuestions = questions.filter((q) => q.trim() !== "");
          setSubmittedQuestions(filteredQuestions);
        }
        // Reset questions after submitting
      })
      .catch((error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      });
  };

  // Render loading spinner during initialization
  if (isLoading) {
    return (
      <Grid
        container
        spacing={0}
        direction="column"
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: "100vh" }}
      >
        <Grid item xs={3}>
          <LoadingSpinner />
        </Grid>
      </Grid>
    );
  }

  // If student already submitted questions, render them, disable eveything
  if (submittedQuestions.length > 0) {
    return (
      <Box flex={1} id={"Box"}>
        <Typography variant="h5" mt={3} textAlign="center">
          You have already submitted your questions
        </Typography>
        {submittedQuestions.map((q, index) => (
          <TextField
            key={index}
            id={`question${index}`}
            label={`Question ${index + 1}`}
            multiline
            variant="filled"
            value={q}
            disabled
            fullWidth
            sx={{ flex: 1, m: 2, width: "95%" }}
            margin="normal"
          />
        ))}
      </Box>
    );
  }

  // Check panel deadline and current time
  if (Date.now() > new Date(panelInfo?.QuestionStageDeadline)) {
    return (
      <>
        <Typography variant="h5" mt={3} textAlign="center">
          Deadline for submitting questions has passed!
        </Typography>
      </>
    );
  }

  // Otherwise, render neccesary questiosn
  return (
    <Box flex={1} id={"Box"}>
      <Typography variant="h5" mt={3} textAlign="center">
        Submit your questions
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
      </Button>
    </Box>
  );
};

export default QuestionsPage;
