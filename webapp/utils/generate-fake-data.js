import { faker } from "@faker-js/faker";

import {
  DynamoDBClient,
  BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";

const ENV = process.env.ENV || "local";

const TABLE_NAME = {
  USER: `${ENV}-user`,
  PANEL: `${ENV}-panel`,
  QUESTIONS: `${ENV}-question`,
};

const client = new DynamoDBClient({});

const teamMembers = [
  {
    UserID: faker.string.uuid(),
    CanvasID: 1111,
    UIN: 11111111,
    EmailID: "joaquin.gimenez@tamu.edu",
    FName: "Joaquin",
    LName: "Gimenez",
    Role: "student",
    Section: "ISTM-622-601",
  },
  {
    UserID: faker.string.uuid(),
    CanvasID: 2222,
    UIN: 22222222,
    EmailID: "anshita.gupta@tamu.edu",
    FName: "Anshita",
    LName: "Gupta",
    Role: "student",
    Section: "ISTM-622-601",
  },
  {
    UserID: faker.string.uuid(),
    CanvasID: 3333,
    UIN: 33333333,
    EmailID: "anujakumthekar@tamu.edu",
    FName: "Anuja",
    LName: "Ajay Kumthekar",
    Role: "student",
    Section: "ISTM-622-601",
  },
  {
    UserID: faker.string.uuid(),
    CanvasID: 4444,
    UIN: 44444444,
    EmailID: "helencrawford@tamu.edu",
    FName: "Helen",
    LName: "Crawford",
    Role: "student",
    Section: "ISTM-622-601",
  },
  {
    UserID: faker.string.uuid(),
    CanvasID: 5555,
    EmailID: "aditya.naik@tamu.edu",
    FName: "Aditya",
    LName: "Naik",
    Role: "student",
    Section: "ISTM-622-601",
    UIN: 55555555,
  },
  {
    UserID: faker.string.uuid(),
    CanvasID: 6666,
    EmailID: "pawan.terdal@tamu.edu",
    FName: "Pawan",
    LName: "Terdal",
    Role: "student",
    Section: "ISTM-622-601",
    UIN: 66666666,
  },
  {
    UserID: faker.string.uuid(),
    CanvasID: 7777,
    EmailID: "hemanth@tamu.edu",
    FName: "Hemanth",
    LName: "Kalyana",
    Role: "student",
    Section: "ISTM-622-601",
    UIN: 77777777,
  },
];

const createDynamoDBUserObject = (user) => {
  const date = new Date(Date.now()).toISOString();

  return {
    UserID: { S: user.UserID },
    CanvasID: { N: user.CanvasID.toString() },
    UIN: { N: user.UIN.toString() },
    EmailID: { S: user.EmailID },
    FName: { S: user.FName },
    LName: { S: user.LName },
    Role: { S: user.Role },
    Section: { S: user.Section },
    CreatedAt: { S: date },
  };
};

const createRandomUser = ({ role = "student" }) => {
  return {
    UserID: faker.string.uuid(),
    CanvasID: faker.number.int({ min: 100, max: 500 }),
    EmailID: faker.internet.email(),
    FName: faker.person.firstName(),
    LName: faker.person.lastName(),
    Role: role,
    Section: "ISTM-622-601",
    UIN: faker.number.int({ min: 1000, max: 5000 }),
  };
};

const generateTeamUsers = () => {
  let newRecord;
  let newMembers = [];
  for (const member of teamMembers) {
    newRecord = { PutRequest: { Item: createDynamoDBUserObject(member) } };
    newMembers.push(newRecord);
  }
  return newMembers;
};

const generateUserWithRole = ({ role = "student" }) => {
  const ramdomStudent = createRandomUser({ role });
  const newRecord = {
    PutRequest: { Item: createDynamoDBUserObject(ramdomStudent) },
  };
  return newRecord;
};

const generateAdmins = ({ count = 2 }) => {
  let admins = [];
  let newAdmin;
  for (let i = 0; i < count; i++) {
    newAdmin = generateUserWithRole({ role: "admin" });
    admins.push(newAdmin);
  }
  return admins;
};

const generatePanelists = ({ count = 4 }) => {
  let panelists = [];
  let newPanelist;
  for (let i = 0; i < count; i++) {
    newPanelist = generateUserWithRole({ role: "panelist" });
    panelists.push(newPanelist);
  }
  return panelists;
};
const generateStudents = ({ count = 5 }) => {
  let students = [];
  let newStudent;
  for (let i = 0; i < count; i++) {
    newStudent = generateUserWithRole({ role: "student" });
    students.push(newStudent);
  }
  return students;
};

const generateUsers = () => {
  const allUsers = [];

  const teamMembers = generateTeamUsers();
  // Concat did not work, ugly but it works
  teamMembers.map((user) => {
    allUsers.push(user);
    return;
  });

  const students = generateStudents({ count: 4 });
  // Concat did not work, ugly but it works
  students.map((user) => {
    allUsers.push(user);
    return;
  });

  const panelists = generatePanelists({ count: 3 });
  // Concat did not work, ugly but it works
  panelists.map((user) => {
    allUsers.push(user);
    return;
  });

  const admins = generateAdmins({ count: 2 });
  // Concat did not work, ugly but it works
  admins.map((user) => {
    allUsers.push(user);
    return;
  });

  return allUsers;
};

const createDynamoDBPanelObject = (panel) => {
  return {
    PanelID: { S: panel.PanelID },
    NumberOfQuestions: { N: panel.NumberOfQuestions.toString() },
    PanelDesc: { S: panel.PanelDesc },
    Panelist: { S: panel.Panelist },
    PanelName: { S: panel.PanelName },
    PanelPresentationDate: { S: panel.PanelPresentationDate },
    PanelStartDate: { S: panel.PanelStartDate },
    PanelVideoLink: { S: panel.PanelVideoLink },
    QuestionStageDeadline: { S: panel.QuestionStageDeadline },
    TagStageDeadline: { S: panel.TagStageDeadline },
    Visibility: { S: panel.Visibility },
    VoteStageDeadline: { S: panel.VoteStageDeadline },
  };
};

const createRandomPanel = () => {
  const randomNumber = faker.number.int({ min: 1, max: 100 });
  const visibility = randomNumber % 2 === 0 ? "public" : "internal";

  const startDate = faker.date.soon({ days: randomNumber });
  const questionsDeadline = faker.date.soon({
    days: 10,
    refDate: startDate,
  });

  const tagDeadline = faker.date.soon({
    days: 10,
    refDate: questionsDeadline,
  });
  const voteDeadline = faker.date.soon({
    days: 10,
    refDate: tagDeadline,
  });
  const presentationDate = faker.date.soon({
    days: 10,
    refDate: voteDeadline,
  });

  return {
    PanelID: faker.string.uuid(),
    NumberOfQuestions: faker.number.int({ min: 3, max: 10 }),
    PanelDesc: faker.lorem.paragraph(),
    Panelist: faker.person.fullName(),
    PanelName: `Panel ${faker.company.buzzAdjective()}`,
    PanelStartDate: startDate,
    QuestionStageDeadline: questionsDeadline,
    TagStageDeadline: tagDeadline,
    VoteStageDeadline: voteDeadline,
    PanelPresentationDate: presentationDate,
    PanelVideoLink: faker.image.urlLoremFlickr(),
    Visibility: visibility,
  };
};

const generatePanels = (panelCount = 5) => {
  const panels = [];
  let randomPanel;
  let newRecord;
  for (let i = 0; i < panelCount; i++) {
    randomPanel = createRandomPanel();
    newRecord = {
      PutRequest: { Item: createDynamoDBPanelObject(randomPanel) },
    };
    panels.push(newRecord);
  }
  return panels;
};

const createDynamoDBQuestionObject = (question) => {
  return {
    QuestionID: { S: question.QuestionID },
    DislikedBy: { L: [] }, // Should be an array of valid user IDs
    LikedBy: { L: [] }, // Should be an array of valid user IDs
    NeutralizedBy: { L: [] }, // Should be an array of valid user IDs
    DislikeScore: { N: question.DislikeScore.toString() },
    FinalScore: { N: question.FinalScore.toString() },
    LikeScore: { N: question.LikeScore.toString() },
    NeutralScore: { N: question.NeutralScore.toString() },
    PanelID: { S: question.PanelID },
    PresentationBonusScore: { N: question.PresentationBonusScore.toString() },
    QuestionText: { S: question.QuestionText },
    UserID: { S: question.UserID },
    VotingStageBonusScore: { N: question.VotingStageBonusScore.toString() },
  };
};

const createRandomQuestion = (panelID, userID) => {
  const question = {
    QuestionID: faker.string.uuid(),
    PanelID: panelID,
    DislikeScore: faker.number.int({ min: 1, max: 100 }),
    FinalScore: faker.number.int({ min: 1, max: 100 }),
    LikeScore: faker.number.int({ min: 1, max: 100 }),
    NeutralScore: faker.number.int({ min: 1, max: 100 }),
    PresentationBonusScore: faker.number.int({ min: 1, max: 100 }),
    VotingStageBonusScore: faker.number.int({ min: 1, max: 100 }),
    QuestionText: faker.lorem.paragraph(),
    UserID: userID,
    LikedBy: [userID], // Should be an array of multiple valid user IDs
    DislikedBy: [userID], // Should be an array of multiple valid user IDs
    NeutralizedBy: [userID], // Should be an array of multiple valid user IDs
  };
  return question;
};

const generateQuestions = (panels, users, questionsByPanel = 5) => {
  let panelID;
  let userID;
  let randomUserIndex;
  let panelQuestions = [];

  // Loop through each generated panel to create questions
  const questions = panels.map((panel) => {
    panelID = panel.PutRequest.Item.PanelID.S;

    for (let i = 0; i < questionsByPanel; i++) {
      // Randomly select a user from the list of users
      randomUserIndex = faker.number.int({ min: 0, max: users.length - 1 });
      userID = users[randomUserIndex].PutRequest.Item.UserID.S;

      // Create a random question
      const question = createRandomQuestion(panelID, userID);

      // Add the question to the list of questions
      panelQuestions.push({
        PutRequest: { Item: createDynamoDBQuestionObject(question) },
      });
    }
    return true;
  });

  return panelQuestions;
};

const main = async () => {
  const users = generateUsers();
  const panels = generatePanels();
  const questions = generateQuestions(panels, users);

  let batchItems = {};

  if (users.length > 0) {
    batchItems[TABLE_NAME.USER] = users;
  }
  if (panels.length > 0) {
    batchItems[TABLE_NAME.PANEL] = panels;
  }
  const putItems = new BatchWriteItemCommand({
    RequestItems: batchItems,
  });
  await client.send(putItems);

  if (questions.length > 0 && panels.length > 0 && questions.length > 0) {
    batchItems = {};
    batchItems[TABLE_NAME.QUESTIONS] = questions;
  }
  /**
   * BatchWriteItemCommand only can handle 25 at the time
   * Need to split for the questions
   */
  const putQuestions = new BatchWriteItemCommand({
    RequestItems: batchItems,
  });
  await client.send(putQuestions);
};

main();
