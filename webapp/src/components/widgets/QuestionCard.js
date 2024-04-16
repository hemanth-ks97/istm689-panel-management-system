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
  Box,
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
  hideActions = false,
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
    <Card
      sx={{
        minWidth: 300,
        height: "120px",
        width: "100%",
        maxWidth: { xs: 400, sm: 600, md: 600, lg: 950 },
        mb: 2,
        mt: 2,
        mr: 2,
      }}
    >
      <CardContent sx={{ padding: "8px 16px 8px 16px" }}>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          Question {questionNumber}
        </Typography>
        <Typography variant="h6">{text}</Typography>
      </CardContent>
      {!hideActions && (
        <CardActions
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>{/*to shift buttons on the right*/}</Box>
          <Box sx={{ display: "flex", gap: 1 }}>
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
          </Box>
        </CardActions>
      )}
    </Card>
  );
};

export default QuestionCard;
