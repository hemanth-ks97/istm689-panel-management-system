import React, { useState, useEffect } from "react";

import { Typography, TextField, Button, Box } from "@mui/material";
import { httpClient } from "../../../client";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import LoadingSpinner from "../../widgets/LoadingSpinner";

const QuestionsPage = () => {
  const { user } = useSelector((state) => state.user);
  const { panelId } = useParams();
  const [panel, setPanel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submittedQuestions, setSubmittedQuestions] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
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
      const panel = await httpClient.get(`/panel/${panelId}`, { headers });
      setPanel(panel);

      const questionsInServer = await httpClient.get(
        `/panel/${panelId}/questions/submitted`,
        {
          headers,
        }
      );

      if (questionsInServer.length > 0) {
        // Student already submitted questions!
        setSubmittedQuestions(questionsInServer);
      } else {
        // Student did not submit questions!
        const numberOfQuestions = panel?.NumberOfQuestions;
        setQuestions(Array(numberOfQuestions).fill(""));
      }

      const deadline = new Date(panel.TagStageDeadline);
      const now = new Date();

      console.log("deadline: " + deadline);
      console.log("now: " + now);

      if (deadline > now) {
        setCanEdit(false);
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
      })
      .catch((error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

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
            disabled={!canEdit}
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
        disabled={!canEdit}
        onClick={handleOnSubmit}
      >
        Submit
      </Button>
    </Box>
  );
};

export default QuestionsPage;
