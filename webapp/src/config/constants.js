export const ADMIN = "admin";
export const STUDENT = "student";
export const PANELIST = "panelist";

{
  /* <input type="button">
<input type="checkbox">
<input type="color">
<input type="date">
<input type="datetime-local">
<input type="email">
<input type="file">
<input type="hidden">
<input type="image">
<input type="month">
<input type="number">
<input type="password">
<input type="radio">
<input type="range">
<input type="reset">
<input type="search">
<input type="submit">
<input type="tel">
<input type="text">
<input type="time">
<input type="url">
<input type="week"></input> */
}

export const DATABASE_ATTRIBUTE_MAPPING = {
  // PANEL DABATASE OBJECT
  Panel: {
    PanelID: { displayName: "ID" },
    PanelName: { displayName: "Name" },
    PanelDesc: { displayName: "Description" },
    Panelist: { displayName: "Panelist" },
    PanelStartDate: { displayName: "Start Date" },
    QuestionStageDeadline: {
      displayName: "Questions Deadline",
    },
    TagStageDeadline: { displayName: "Tag Deadline" },
    VoteStageDeadline: { displayName: "Vote Deadline" },
    PanelPresentationDate: {
      displayName: "Presentation Date",
    },
    NumberOfQuestions: { displayName: "# of Questions" },
    PanelVideoLink: { displayName: "Video Link" },
    Visibility: { displayName: "Visibility" },
    CreatedAt: { displayName: "Created At" },
  },
  //   METRIC DATABASE OBJECT
  Metric: {
    PanelID: { header: "ID" },
    UserID: { header: "User ID" },
    QuestionStageScore: { header: "Questions Score" },
    TagStageScore: { header: "Tag Score" },
    VoteStageScore: { header: "Vote Score" },
    FinalTotalScore: { header: "Final Score" },
    EnteredQuestionsTotalScore: {
      header: "Entered Questions Score",
    },
    TagStageInTime: { header: "Tag In Time" },
    TagStageOutTime: { header: "Tag Out Time" },
    TagStageSD: { header: "Tag Standard Deviation" },
    VoteStageSD: {
      header: "Vote Standard Deviation",
    },
    VoteStageInTime: { header: "Vote In Time" },
    VoteStageOutTime: { header: "Vote Out Time" },
    CreatedAt: {},
  },
  User: {
    EmailID: {},
    UserID: {},
    Role: {},
    FName: {},
    CanvasID: {},
    UIN: {},
    Section: {},
    LName: {},
    CreatedAt: {},
  },
  Question: {},
};
