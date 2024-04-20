import React, { useState, useEffect } from "react";

// MUI
import {
  Box,
  Typography,
  Button,
  Divider,
  Link,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useParams, Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import { httpClient } from "../../../client";
import LoadingSpinner from "../../widgets/LoadingSpinner";

const PanelPage = () => {
  const { panelId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);
  const [panel, setPanel] = useState(null);
  const [questions, setQuestions] = useState([]);


  const menus = [
    {
      title: "Submit Questions",
      path: "question",
      objectKey: "QuestionStageDeadline",
    },
    { title: "Tag Questions", path: "tagging", objectKey: "TagStageDeadline" },
    { title: "Vote Questions", path: "voting", objectKey: "VoteStageDeadline" },
  ];

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  useEffect(() => {
    httpClient
      .get(`/panel/${panelId}`, {
        headers,
      })
      .then((response) => {
        setPanel(response.data);
      })
      .catch((error) =>
        enqueueSnackbar(error.message, {
          variant: "error",
        })
      );
  }, []);

  useEffect(() => {
    httpClient
      .get(`/panel/${panelId}/questions/final`, {
        headers,
      })
      .then((response) => {
        const formattedQuestions = response.data.map(question => ({
          id: question.rep_id,
          question: question.rep_question,
          votes: question.votes
        }));
        setQuestions(formattedQuestions);
      })
      .catch((error) => {
        enqueueSnackbar(error.message, {
          variant: "error",
        })
      });
}, []);

  if (!panel) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography
        variant="h4"
        mt={2}
        textAlign="center"
        sx={{ fontFamily: "monospace", fontWeight: "bold" }}
      >
        {panel.PanelName}
      </Typography>
      <Typography
        variant="h6"
        mx={2}
        textAlign="left"
        sx={{ fontWeight: "bold" }}
      >
        Description:
      </Typography>
      <Typography mx={2}> {panel.PanelDesc} </Typography>
      <Typography
        variant="h6"
        mx={2}
        textAlign="left"
        sx={{ fontWeight: "bold" }}
      >
        Panelist:
      </Typography>
      <Typography mx={2}>{panel.Panelist}</Typography>
      <Typography
        variant="h6"
        mx={2}
        textAlign="left"
        sx={{ fontWeight: "bold" }}
      >
        Presentation Date:
      </Typography>
      <Typography mx={2}>
        {new Date(panel.PanelPresentationDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        })}
      </Typography>
      <Typography
        variant="h6"
        mx={2}
        textAlign="left"
        sx={{ fontWeight: "bold" }}
      >
        Number of Questions:
      </Typography>
      <Typography mx={2}>{panel.NumberOfQuestions}</Typography>

      <Typography
        variant="h6"
        mx={2}
        textAlign="left"
        sx={{ fontWeight: "bold" }}
      >
        Link to the Video:
      </Typography>
      <Typography mx={2}>
        <Link
          href={panel.PanelVideoLink}
          underline="hover"
          target="_blank"
          rel="noopener"
        >
          {panel.PanelVideoLink}
        </Link>
      </Typography>
      <br />
      <Divider />
      <br />
      <Grid container spacing={2} mx={2} width={"97%"}>
        {menus.map((menu) => {
          return (
            <Grid item xs={2} md={4}>
              <Paper elevation={3} align="center">
                <br />
                <Typography variant="h6">{menu.title}</Typography>
                <Typography>
                  Deadline{" "}
                  {new Date(panel[menu.objectKey]).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                </Typography>
                <br />
                <Divider />
                <br />
                <Button variant="contained" onClick={() => navigate(menu.path)}>
                  Go to
                </Button>
                <br />
                <br />
              </Paper>
            </Grid>
          );
        })}

        <Grid item xs={8}>
          <Paper elevation={3} align="center">
            <Outlet />
          </Paper>
        </Grid>
      </Grid>
      {/* New Section for Voting Result Questions */}
      <br />
      <Divider />
      <Typography
        variant="h5"
        mt={2}
        mx={2}
        mb={2}
        textAlign="left"
        sx={{ fontWeight: "bold" }}
      >
       Voting Stage Result:
      </Typography>
      <Box sx={{ mx: 2, boxShadow: 3, bgcolor: 'background.paper' }}> {/* Added box with shadow */}
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {questions.map((question, index) => (
          <ListItem key={index}>
            <ListItemText primary={`${index + 1}. ${question.question}`} />
          </ListItem>
        ))}
      </List>
      </Box>
    </Box>
  );
};

export default PanelPage;
