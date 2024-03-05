import React, { useState } from "react";

import QuestionList from "../widgets/QuestionList";
import { Typography, TextField, Button } from "@mui/material";
import { httpClient } from "../../client";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import { useLocation, useParams } from "react-router-dom";

const QuestionsPage = () => {
  const { pathname } = useLocation();
  const { panelId } = useParams();
  const { user } = useSelector((state) => state.user);
  const [question, setQuestion] = useState("");
  const { enqueueSnackbar } = useSnackbar();

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  const handleOnSubmit = () => {
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
        setQuestion("");
      })
      .catch((error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      });
  };

  let items;

  if (pathname.endsWith("questions")) {
    items = <QuestionList />;
  }
  if (pathname.endsWith("question")) {
    items = (
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
        <Button variant="contained" color="primary" onClick={handleOnSubmit}>
          Submit
        </Button>{" "}
      </>
    );
  }
  return <>{items}</>;
};

export default QuestionsPage;
