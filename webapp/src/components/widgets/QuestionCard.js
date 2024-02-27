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

const QuestionCard = ({ questionText, questionID, questionNumber }) => {
  const handleDislike = () => console.log(`Question  ${questionID} disliked`);

  const handleLike = () => console.log(`Question  ${questionID} liked`);

  const handleFlag = () => console.log(`Question  ${questionID} flagged`);

  return (
    <Card sx={{ minWidth: 275 }}>
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
