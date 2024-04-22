import React, { useState, useEffect } from "react";

// MUI
import {
  Typography,
  Box,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import { httpClient } from "../../../client";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import LoadingSpinner from "../../widgets/LoadingSpinner";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Tooltip from "@mui/material/Tooltip";

const Row = ({ row }) => {
  const [open, setOpen] = useState(false);

  const renderHelpIcon = (message) => (
    <Tooltip title={<div style={{ lineHeight: "1.2" }}>{message}</div>} arrow>
      <IconButton
        size="small"
        sx={{
          position: "relative",
          top: "-5px",
          left: "2px",
          marginLeft: "5px",
          padding: 0,
        }}
      >
        <HelpOutlineIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  const renderGradeType = (gradesRow) => (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Typography variant="body2" component="span">
        {gradesRow.type}
      </Typography>
      {gradesRow.type === "Submit Questions Stage" &&
        renderHelpIcon(
          "Improve your score by submitting all designated questions for the panel, focusing on the quality of your responses, and maintaining active engagement throughout the stage"
        )}
      {gradesRow.type === "Tagging Questions Stage" &&
        renderHelpIcon(
          "Improve your score by actively engaging throughout the stage: like, dislike, and group similar questions to demonstrate thoughtful participation"
        )}
      {gradesRow.type === "Voting Questions Stage" &&
        renderHelpIcon(
          "Improve your score by actively participating in voting throughout the stage"
        )}
    </Box>
  );

  const SVGProgressBar = ({ grade, mean, max, min }) => {
    // Normalize values for SVG coordinate system (0 to 150)
    const svgWidth = 150;
    const normalize = (value) => (value * svgWidth) / 100;
    const minPos = normalize(min);
    const maxPos = normalize(max);
    const meanPos = normalize(mean);
    const gradePos = normalize(grade);

    return (
      <Box sx={{ float: "right", marginRight: "30px", cursor: "pointer" }}>
        <svg
          viewBox="0 0 160 30"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "161px", height: "30px" }}
        >
          <title>
            Median: {mean}, High: {max}, Low: {min}
          </title>
          {/* Base lines */}
          <line x1="0" y1="3" x2="0" y2="27" stroke="#556572" />
          <line x1={svgWidth} y1="3" x2={svgWidth} y2="27" stroke="#556572" />

          {/* Statistical Markers */}
          <line
            x1={minPos}
            y1="6"
            x2={minPos}
            y2="24"
            stroke="#556572"
            strokeWidth="2"
          />
          <line
            x1={minPos}
            y1="15"
            x2={maxPos}
            y2="15"
            stroke="#556572"
            strokeWidth="2"
          />
          <line
            x1={maxPos}
            y1="6"
            x2={maxPos}
            y2="24"
            stroke="#556572"
            strokeWidth="2"
          />
          <rect
            x={meanPos}
            y="3"
            width="0"
            height="24"
            stroke="#556572"
            strokeWidth="2"
            rx="3"
            fill="none"
          />
          <line
            x1={meanPos}
            y1="3"
            x2={meanPos}
            y2="27"
            stroke="#556572"
            strokeWidth="2"
          />

          {/* User's Score Marker */}
          <Tooltip title={`Your Score: ${grade} out of ${max}`}>
            <rect
              x={gradePos - 7}
              y="8"
              width="14"
              height="14"
              stroke="#224488"
              strokeWidth="2"
              rx="3"
              fill="#aabbdd"
            />
          </Tooltip>
        </svg>
      </Box>
    );
  };

  return (
    <>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row.name}
        </TableCell>
        <TableCell>{row.total < 0 ? "N/A" : row.total}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Grade Breakdown
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Criteria</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {" "}
                      Your Grade
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {" "}
                      Mean Grade
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {" "}
                      Max Grade
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {" "}
                      Min Grade
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.grades.map((gradesRow) => (
                    <TableRow key={gradesRow.type}>
                      <TableCell component="th" scope="row">
                        {renderGradeType(gradesRow)}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 550 }}>
                        {gradesRow.grade < 0 ? "N/A" : gradesRow.grade}
                      </TableCell>
                      <TableCell>
                        {gradesRow.mean < 0 ? "N/A" : gradesRow.mean}
                      </TableCell>
                      <TableCell>
                        {gradesRow.max < 0 ? "N/A" : gradesRow.max}
                      </TableCell>
                      <TableCell>
                        {gradesRow.min < 0 ? "N/A" : gradesRow.min}
                      </TableCell>
                      <TableCell>
                        {gradesRow.grade >= 0 &&
                        gradesRow.mean >= 0 &&
                        gradesRow.max >= 0 &&
                        gradesRow.min >= 0 ? (
                          <SVGProgressBar
                            grade={gradesRow.grade}
                            mean={gradesRow.mean}
                            max={gradesRow.max}
                            min={gradesRow.min}
                          />
                        ) : (
                          <span> </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const GradesPage = () => {
  const { user } = useSelector((state) => state.user);
  const { enqueueSnackbar } = useSnackbar();
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  useEffect(() => {
    setIsLoading(true);
    httpClient
      .get("/my/metrics", { headers })
      .then((response) => {
        setMetrics(response.data);
      })
      .catch((error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScren />;
  }

  if (metrics.length === 0) {
    return <Typography>Did not fetch any grades</Typography>;
  }

  // Build rows for the panels!

  const grades = metrics.map((metric) => {
    return {
      name: metric?.PanelName || "Could not determine panel name",
      total: metric?.FinalTotalScore || -1,
      grades: [
        {
          type: "Submit Questions Stage",
          grade: metric?.QuestionStageScore || -1,
          mean: metric?.QuestionStageMean || -1,
          max: metric?.QuestionStageMax || -1,
          min: metric.QuestionStageMin || -1,
        },
        {
          type: "Tagging Questions Stage",
          grade: metric?.TagStageScore || -1,
          mean: metric?.TagStageMean || -1,
          max: metric?.TagStageMax || -1,
          min: metric?.TagStageMin || -1,
        },
        {
          type: "Voting Questions Stage",
          grade: metric?.VoteStageScore || -1,
          mean: metric?.VoteStageMean || -1,
          max: metric?.VoteStageMax || -1,
          min: metric?.VoteStageMin || -1,
        },
      ],
    };
  });

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography
        variant="h4"
        mt={2}
        textAlign="center"
        sx={{ fontFamily: "monospace", fontWeight: "bold" }}
      >
        Grades
      </Typography>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ flexGrow: 1 }}
      >
        <Paper
          square={false}
          style={{
            width: 1000,
            margin: 2,
            padding: 2,
            textAlign: "center",
            typography: "body2",
          }}
        >
          <TableContainer component={Paper}>
            <Table aria-label="collapsible table">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell sx={{ fontWeight: "bold" }}>Panel</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Grade</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grades.map((grade, idx) => {
                  return (
                    <Row
                      sx={{ fontWeight: "bold" }}
                      key={`header-${idx}`}
                      row={grade}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default GradesPage;
