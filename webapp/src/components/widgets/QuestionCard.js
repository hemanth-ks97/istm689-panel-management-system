import React from "react";
// MUI
import {
  Typography,
  Card,
  CardActions,
  CardContent,
  Tooltip,
  IconButton,
} from "@mui/material";

import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Flag as FlagIcon,
} from "@mui/icons-material";

import { useSnackbar } from "notistack";

const QuestionCard = ({ questionText, questionID, questionNumber }) => {
  const { enqueueSnackbar } = useSnackbar();
  const handleDislike = () =>
    enqueueSnackbar(`Question disliked`, { variant: "error" });
  const handleLike = () =>
    enqueueSnackbar(`Question liked`, { variant: "success" });
  const handleFlag = () =>
    enqueueSnackbar(`Question flagged`, { variant: "warning" });

  return (
    <Card sx={{ minWidth: 275, maxWidth: 400 }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color={"primary"} gutterBottom>
          Question {questionNumber}
        </Typography>
        <Typography variant="h5" component="div">
          {questionText}
        </Typography>
      </CardContent>
      <CardActions>
        <Tooltip title="Like this question">
          <IconButton onClick={handleLike}>
            <ThumbUpIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Dislike this question">
          <IconButton onClick={handleDislike}>
            <ThumbDownIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Flag as inappropriate">
          <IconButton onClick={handleFlag}>
            <FlagIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default QuestionCard;
