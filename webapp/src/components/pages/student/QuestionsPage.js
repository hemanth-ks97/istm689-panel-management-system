import React, { useState, useEffect } from "react";

import { Typography, TextField, Button, Box } from "@mui/material";
import { httpClient } from "../../../client";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import LoadingSpinner from "../../widgets/LoadingSpinner";

const QuestionsPage = () => {
  const { panelId } = useParams();
  const { user } = useSelector((state) => state.user);
  const [questions, setQuestions] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [pageTitle, setPageTitle] = useState("Submit your Questions");

  const [isLoading, setIsLoading] = useState(true);
  // const [panel, setPanel] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  // useEffect(() => {
  //   if (!panelId) {
  //     return;
  //   }

  //   const numberOfQuestions = panel?.NumberOfQuestions;
  //   setQuestions(Array(numberOfQuestions).fill(""));

  //   // setIsLoading(true);
  //   // httpClient
  //   //   .get(`/panel/${panelId}/questions/submitted`, {
  //   //     headers,
  //   //   })
  //   //   .then(({ data }) => {
  //   //     // check if there are some questions already submitted
  //   //   })
  //   //   .catch(() => {})
  //   //   .finally(() => setIsLoading(false));
  // }, [panel]);

  useEffect(() => {
    if (!panelId) {
      return;
    }

    httpClient
      .get(`/panel/${panelId}/questions/submitted`, {
        headers,
      })
      .then(({ data }) => {
        const submittedQuestions = data?.questions || [];

        if (submittedQuestions.length > 0) {
          const questionText = submittedQuestions.map(
            (question) => question.QuestionText
          );
          setPageTitle("Your submitted questions");
          setQuestions(questionText);
        }
      })
      .catch((error) => {
        enqueueSnackbar(error.message, {
          variant: "error",
        });
      })
      .finally(() => setIsLoading(false));
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
      })
      .catch((error) => {
        console.log(error);
        enqueueSnackbar(error.message, { variant: "error" });
      });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box flex={1} id={"Box"}>
      <Typography variant="h5" mt={3} textAlign="center">
        {pageTitle}
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
