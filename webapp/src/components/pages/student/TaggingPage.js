import { React, useEffect, useState } from "react";

// MUI
import { Box, Stepper, Step, StepLabel, Typography, StepConnector } from "@mui/material";
import LikeQuestionPage from "./LikeQuestionPage";
import { httpClient } from "../../../client";
import { useParams } from "react-router-dom";
import LoadingSpinner from "../../widgets/LoadingSpinner";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import CombineQuestionsPage from "./CombineQuestionsPage";
/**
 * in this component we can render different steps like liking/disliking/flagging questions,
 * marking questions as similar
 * for now we are rendering the first step which is liking/dsilking/flagging questions
 *
 */
const steps = ['Reacting on Questions', 'Combining Questions'];

const TaggingPage = () => {

  const [activeStep, setActiveStep] = useState(0);
  const [questionList, setQuestionList] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const { panelId } = useParams();
  const { user } = useSelector((state) => state.user);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const getStepContent = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return <LikeQuestionPage questions={questionList} onNext={handleNext} />;
      case 1:
        return <CombineQuestionsPage questions={questionList} onBack={handleBack} onNext={handleNext} />; 
      default:
        return 'Reaction Submitted';
    }
  };

  const getStepDescription = () => {
    switch (activeStep) {
      case 0:
        return " (Like, dislike or flag the below questions)";
      case 1:
        return " (Combine duplicate questions if any)";
      default:
        return "";
    }
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
    <Box sx={{ width: '100%', minHeight: 200, maxHeight: { xs: 600, sm: 800, md: 800, lg: 2000 } }}>
      <Typography variant="h5" gutterBottom style={{ textAlign: 'center' }}>Tag Questions</Typography>
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Stepper activeStep={activeStep}
               sx={{ maxWidth: '800px', width: '100%', '.MuiStepConnector-line': { flexGrow: 0 } }}
              >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      </Box>
      {/* Step Description */}
      <Typography variant="h6" gutterBottom style={{ marginTop: 6, textAlign: 'center' }}>
        Step {activeStep + 1}: {steps[activeStep]}
        {getStepDescription()}
      </Typography>
      <Box>
        {getStepContent(activeStep)}
      </Box>
    </Box>
  );
};

export default TaggingPage;
