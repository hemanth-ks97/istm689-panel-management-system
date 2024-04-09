import React, { useState } from 'react';
import { Box, Button, Grid, Checkbox, FormControlLabel } from '@mui/material';
import QuestionCard from '../../widgets/QuestionCard';
import LoadingSpinner from '../../widgets/LoadingSpinner';

const FilterQuestionsPage = ({ questions, onNext, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [groupCounter, setGroupCounter] = useState(0); // Counter to assign unique group IDs
  const [similarGroups, setSimilarGroups] = useState([]);
  const [groupColors] = useState(["#FFC0CB", "#ADD8E6", "#90EE90", "#FFB6C1", "#FFFACD"]); // Example color array
  const [similarGroupsHistory, setSimilarGroupsHistory] = useState([]);
  const [allQuestionsHistory, setAllQuestionsHistory] = useState([]);

  const initialQuestions = Object.entries(questions).map(([id, text]) => ({
    id,
    text,
    checked: false,
    isSimilar: false,
    groupId: null, // Track group ID for coloring
  }));

  const [allQuestions, setAllQuestions] = useState(initialQuestions);

  const handleCheckboxChange = (id) => {
    setAllQuestions(allQuestions.map(question =>
      question.id === id ? { ...question, checked: !question.checked } : question
    ));
  };

  const handleMarkSelectedAsSimilar = () => {
    const selectedQuestions = allQuestions.filter(q => q.checked);
    if (selectedQuestions.length > 0) {
      // Store the current state in history before updating
      setSimilarGroupsHistory([...similarGroupsHistory, similarGroups]);
      setAllQuestionsHistory([...allQuestionsHistory, allQuestions]);
  
      // Your existing logic to update similarGroups and allQuestions
      const newGroupId = groupCounter;
      setSimilarGroups([...similarGroups, selectedQuestions.map(q => q.id)]);
      setAllQuestions(allQuestions.map(question => ({
        ...question,
        checked: false,
        isSimilar: question.checked || question.isSimilar,
        groupId: question.checked ? newGroupId : question.groupId,
      })));
      setGroupCounter(groupCounter + 1);
    }
  };

  const undoLastAction = () => {
    if (similarGroupsHistory.length > 0 && allQuestionsHistory.length > 0) {
      // Revert to the last state from history
      setSimilarGroups(similarGroupsHistory[similarGroupsHistory.length - 1]);
      setAllQuestions(allQuestionsHistory[allQuestionsHistory.length - 1]);
  
      // Remove the last history entry to ensure correct future undos
      setSimilarGroupsHistory(similarGroupsHistory.slice(0, -1));
      setAllQuestionsHistory(allQuestionsHistory.slice(0, -1));
    }
  };

  const handleSubmit = () => {
    const requestBody = {
      similar: similarGroups,
    };
    console.log(requestBody); // Here, replace with your API call
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Grid container spacing={2} sx={{ padding: 2, overflow: 'auto', justifyContent: 'center' }}>
      {allQuestions.map((question, index) => (
        <Grid item xs={6} key={question.id}>
          <Box sx={{
            marginBottom: 0,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: question.isSimilar ? groupColors[question.groupId % groupColors.length] : "transparent", // Apply color based on groupId
          }}>
            <FormControlLabel sx={{ marginLeft: '0px', marginRight: '0px', }}
              control={<Checkbox checked={question.checked} onChange={() => handleCheckboxChange(question.id)} name={question.id} disabled={question.isSimilar} />}
              label=""
            />
            <QuestionCard {...question} questionNumber={index + 1} />
          </Box>
        </Grid>
      ))}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
        <Button variant="outlined" onClick={handleMarkSelectedAsSimilar}>Mark as Similar</Button>
        <Button variant="outlined" onClick={undoLastAction} disabled={similarGroupsHistory.length === 0}>Undo</Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>Submit</Button>
      </Box>
    </Grid>
  );
};

export default FilterQuestionsPage;
