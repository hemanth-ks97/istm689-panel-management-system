export const ADMIN = "admin";
export const STUDENT = "student";
export const PANELIST = "panelist";

export const DATABASE_ATTRIBUTE_MAPPING = {
  // PANEL DABATASE OBJECT
  Panel: {
    PanelID: { displayName: "ID", type: "text" },
    PanelName: { displayName: "Name", type: "text" },
    PanelDesc: { displayName: "Description", type: "text" },
    Panelist: { displayName: "Panelist", type: "text" },
    PanelStartDate: { displayName: "Start Date", type: "text" },
    QuestionStageDeadline: {
      displayName: "Questions Deadline",
      type: "text",
    },
    TagStageDeadline: { displayName: "Tag Deadline", type: "text" },
    VoteStageDeadline: { displayName: "Vote Deadline", type: "text" },
    PanelPresentationDate: {
      displayName: "Presentation Date",
      type: "text",
    },
    NumberOfQuestions: { displayName: "# of Questions", type: "number" },
    PanelVideoLink: { displayName: "Video Link", type: "url" },
    Visibility: { displayName: "Visibility", type: "text" },
    CreatedAt: { displayName: "Created At", type: "text" },
  },
  //   METRIC DATABASE OBJECT
  Metric: {
    PanelID: { displayName: "Panel ID", type: "text" },
    UserID: { displayName: "User ID", type: "text" },
    UserFName: { displayName: "User First Name", type: "text" },
    UserLName: { displayName: "User Last Name", type: "text" },
    QuestionStageScore: { displayName: "Questions Score", type: "number" },
    TagStageScore: { displayName: "Tag Score", type: "number" },
    VoteStageScore: { displayName: "Vote Score", type: "number" },
    FinalTotalScore: { displayName: "Final Score", type: "number" },
    EnteredQuestionsTotalScore: {
      displayName: "Entered Questions Score",
      type: "number",
    },
    TagStageInTime: { displayName: "Tag In Time", type: "text" },
    TagStageOutTime: { displayName: "Tag Out Time", type: "text" },
    TagStageSD: { displayName: "Tag Standard Deviation", type: "number" },
    VoteStageSD: {
      displayName: "Vote Standard Deviation",
      type: "number",
    },
    VoteStageInTime: { displayName: "Vote In Time", type: "text" },
    VoteStageOutTime: { displayName: "Vote Out Time", type: "text" },
    CreatedAt: { displayName: "Created At", type: "text" },
  },
  User: {
    UserID: { displayName: "ID", type: "text" },
    EmailID: { displayName: "Email", type: "email" },
    FName: { displayName: "First Name", type: "text" },
    LName: { displayName: "Last Name", type: "text" },
    UIN: { displayName: "UIN", type: "text" },
    Role: { displayName: "Role", type: "text" },
    CanvasID: { displayName: "Canvas ID", type: "text" },
    Section: { displayName: "Section", type: "text" },
    CreatedAt: { displayName: "CreatedAt", type: "text" },
  },
  Question: {},
};
