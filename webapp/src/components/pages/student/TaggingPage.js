import { React, useEffect, useState } from "react";

// MUI
import { Box } from "@mui/material";
import LikeQuestionPage from "./LikeQuestionPage";
import { httpClient } from "../../../client";
import { useParams } from "react-router-dom";
import LoadingSpinner from "../../widgets/LoadingSpinner";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
/**
 * in this component we can render different steps like liking/disliking/flagging questions,
 * marking questions as similar
 * for now we are rendering the first step which is liking/dsilking/flagging questions
 *
 */
const TaggingPage = () => {

  const [questionList, setQuestionList] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const { panelId } = useParams();
  const { user } = useSelector((state) => state.user);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  useEffect(() => {
    setLoading(true);
    httpClient
      .get(`/panel/${panelId}/questions/tagging`, {
        headers: headers,
      })
      .then((response) => {
        setQuestionList(response.data.question)
        console.log(response.data.question)
      })
      .catch((error) =>
        enqueueSnackbar(error.message, {
          variant: "error",
        })
      )
      .finally(() => setLoading(false));

  }, [])

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <LikeQuestionPage questions = {questionList}/>
    </Box>
  );
};

export default TaggingPage;
