import React, { useState } from "react";
// MUI
import { Typography, TextField, Button, List, ListItem } from "@mui/material";
// Redux
import { useSelector } from "react-redux";
// Utils
import { httpClient } from "../../client";
import QuestionCard from "../widgets/QuestionCard";
import { useSnackbar } from "notistack";

const QuestionsPage = () => {
  const { user } = useSelector((state) => state.user);
  const { enqueueSnackbar } = useSnackbar();
  const [question, setQuestion] = useState("");
  const [allQuestions, setAllQuestions] = useState([]);

  const [isApiWaiting, setIsApiWaiting] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };
  const handleOnSubmit = () => {
    setIsApiWaiting(true);
    if (question === "") {
      enqueueSnackbar("Question cannot be empty", { variant: "error" });
      setIsApiWaiting(false);
      return;
    }

    const data = { question: question.trim() };
    httpClient
      .post("/question", data, {
        headers: headers,
      })
      .then((response) => {
        enqueueSnackbar("Submited!", { variant: "success" });
        setQuestion("");
      })
      .catch((error) => enqueueSnackbar(error.message, { variant: "error" }))
      .finally(() => setIsApiWaiting(false));
  };

  const handleGetQuestions = () => {
    setIsApiWaiting(true);

    httpClient
      .get("/question", {
        headers: headers,
      })
      .then((response) => {
        setAllQuestions(response.data);
        enqueueSnackbar(`Fetched ${response?.data?.length}  questions`, {
          variant: "success",
        });
      })
      .catch((error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      })
      .finally(() => setIsApiWaiting(false));
  };

  return (
    <>
      <Typography variant="h4">QuestionsPage component</Typography>
      <TextField
        id="question1"
        label="Question 1"
        placeholder="Please write your question"
        multiline
        variant="filled"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <p></p>
      <Button
        variant="contained"
        color="primary"
        disabled={isApiWaiting}
        onClick={handleOnSubmit}
      >
        Submit
      </Button>{" "}
      <Button
        variant="contained"
        color="primary"
        disabled={isApiWaiting}
        onClick={handleGetQuestions}
      >
        Fetch all Questions
      </Button>
      {allQuestions.length > 0 ? (
        <List>
          {allQuestions.map((question, idx) => {
            return (
              <ListItem key={idx}>
                <QuestionCard
                  questionText={question?.Question}
                  questionID={question?.QuestionID}
                  questionNumber={idx + 1}
                />
              </ListItem>
            );
          })}
        </List>
      ) : (
        <Typography>No questions fetched</Typography>
      )}
    </>
  );
};

export default QuestionsPage;
