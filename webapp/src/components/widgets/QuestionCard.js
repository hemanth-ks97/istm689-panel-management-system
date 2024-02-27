import React from "react";
// MUI
import {
  Typography,
  Card,
  CardActions,
  CardContent,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import FlagIcon from "@mui/icons-material/Flag";

const QuestionCard = ({ questionText, questionID, questionNumber}) => {

  const handleDislike = () => {
    console.log(`Question  ${questionID} disliked`);
  };

  const handleLike = () => {
    console.log(`Question  ${questionID} liked`);
  };

  const handleFlag = () => {
    console.log(`Question  ${questionID} flagged`);
  };

  return (
    <>
      <Card sx={{ minWidth: 275 }}>
        <CardContent>
          <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
            Question {questionNumber}
          </Typography>
          <Typography variant="h5" component="div">
            {questionText}
          </Typography>
        </CardContent>
        <CardActions>
          <IconButton onClick={handleLike}>
            <ThumbUpIcon />
          </IconButton>
          <IconButton onClick={handleDislike}>
            <ThumbDownIcon />
          </IconButton>
          <IconButton onClick={handleFlag}>
            <FlagIcon />
          </IconButton>
        </CardActions>
      </Card>
    </>
  );
};

export default QuestionCard;
