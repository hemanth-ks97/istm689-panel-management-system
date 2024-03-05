import React, { useState, useEffect } from "react";
// MUI
import { httpClient } from "../../client";

import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import ListDisplay from "./ListDisplay";
import LoadingSpinner from "./LoadingSpinner";
import { useParams } from "react-router-dom";

const QuestionList = () => {
  const { user } = useSelector((state) => state.user);
  const [questions, setQuestions] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(true);
  const { panelId } = useParams();

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  // fetch the questions everytime this component is rendered
  useEffect(() => {
    setIsLoading(true);

    httpClient
      .get(`/panel/${panelId}/questions`, {
        headers: headers,
      })
      .then((response) => {
        setQuestions(response.data);
        enqueueSnackbar(`Fetched ${response?.data?.length}  questions`, {
          variant: "success",
        });
      })
      .catch((error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ListDisplay data={questions} isAdmin={true} idAttributeName="QuestionID" />
  );
};

export default QuestionList;
