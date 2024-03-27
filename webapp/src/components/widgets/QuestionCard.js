// QuestionCard.js
import React from "react";
import { useSnackbar } from "notistack";
import {
  Card,
  CardActions,
  CardContent,
  Tooltip,
  IconButton,
  Typography,
} from "@mui/material";
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Flag as FlagIcon,
} from "@mui/icons-material";

const QuestionCard = ({
  text,
  id,
  questionNumber,
  isLiked,
  isDisliked,
  isFlagged,
  onUpdate,
}) => {
  const { enqueueSnackbar } = useSnackbar();

  const handleDislike = () => {
    onUpdate(id, "isDisliked");
    if (!isDisliked) {
      enqueueSnackbar(`Question disliked`, { variant: "error" });
    }
  };

  const handleLike = () => {
    onUpdate(id, "isLiked");
    if (!isLiked) {
      enqueueSnackbar(`Question liked`, { variant: "success" });
    }
  };

  const handleFlag = () => {
    onUpdate(id, "isFlagged");
    if (!isFlagged) {
      enqueueSnackbar(`Question flagged`, { variant: "warning" });
    }
  };

  return (
    <Card sx={{ minWidth: 275, maxWidth: 400, mb: 2 }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          Question {questionNumber}
        </Typography>
        <Typography variant="h5">{text}</Typography>
      </CardContent>
      <CardActions>
        <Tooltip title="Like this question">
          <IconButton
            onClick={handleLike}
            color={isLiked ? "primary" : "default"}
          >
            <ThumbUpIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Dislike this question">
          <IconButton
            onClick={handleDislike}
            color={isDisliked ? "secondary" : "default"}
          >
            <ThumbDownIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Flag as inappropriate">
          <IconButton
            onClick={handleFlag}
            sx={{
              color: isFlagged ? "red" : "default",
            }}
          >
            <FlagIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default QuestionCard;
